/**
 * Gemini API Integration Service
 * Uses the official @google/genai SDK with multi-model fallback support.
 */

const { GoogleGenAI } = require('@google/genai');

const MODELS_TO_TRY = [
  'gemini-2.0-flash-lite',       // Lightest quota usage, try first
  'gemini-2.0-flash',             // Standard free tier
  'gemini-2.0-flash-exp',         // Experimental fallback
  'gemini-1.5-pro',               // Stable v1 model
];

async function generateContentWithFallback(genAI, options) {
  let lastError = null;
  for (const model of MODELS_TO_TRY) {
    try {
      const response = await genAI.models.generateContent({
        ...options,
        model
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err) {
      console.warn(`[Gemini] Model ${model} failed: ${err.message}. Trying next model...`);
      lastError = err;
    }
  }
  throw lastError || new Error('All Gemini models failed to respond.');
}

/**
 * Analyze a resume using Gemini.
 */
async function analyzeResumeWithGemini(resumeText, dbContext, apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    throw new Error('Invalid or missing Gemini API Key.');
  }

  const genAI = new GoogleGenAI({ apiKey: apiKey.trim() });

  const systemPrompt = `You are a Senior Executive Recruiter, ATS Expert, and Career Strategist.
Analyze the candidate's resume text against modern tech industry benchmarks and hiring standards.

CRITICAL INSTRUCTIONS FOR OUTPUT:
- NEVER mention "database", "database context", "MongoDB", "internal corpus", or "stored resumes".
- Frame all benchmark evaluations in terms of "industry benchmarks, executive recruitment standards, and market percentiles".

You must generate a structured analysis report in JSON format. Do not return any text before or after the JSON.
Your JSON must strictly match the following schema:
{
  "ats_score": 85,
  "extracted_skills": ["Skill1", "Skill2"],
  "missing_competencies": ["MissingSkill1"],
  "matched_roles": [
    { "title": "Role Name", "matchPercentage": 90 }
  ],
  "suggestions": [
    "Suggestion 1...",
    "Suggestion 2..."
  ],
  "skill_development": [
    { "skill": "SkillName", "recommendation": "Step-by-step pathway or resources to acquire this skill." }
  ],
  "executive_summary": "A high-quality 3-4 sentence professional evaluation summarizing their strengths, core focus, and critical improvement areas."
}`;

  const userMessage = `Here is the candidate's resume text to analyze:
---
${resumeText}
---

Return ONLY the JSON object.`;

  const textResponse = await generateContentWithFallback(genAI, {
    contents: userMessage,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  return cleanAndParseJSON(textResponse);
}

function cleanAndParseJSON(rawText) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  return JSON.parse(cleaned.trim());
}

/**
 * Chat with Gemini about a resume.
 */
async function chatWithGemini(userMessage, history = [], resumeText, dbContext, apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    throw new Error('Invalid or missing Gemini API Key.');
  }

  const genAI = new GoogleGenAI({ apiKey: apiKey.trim() });

  const systemPrompt = `You are a Senior AI Executive Career Strategist and Resume Assistant.
You are helping the candidate evaluate their profile, optimize ATS keywords, target executive roles, identify skill gaps, and write bullet points.

CRITICAL INSTRUCTIONS:
- NEVER mention "database", "database context", "MongoDB", "internal corpus", "other uploaded files", or "our database".
- Frame all insights in terms of "industry standards, executive hiring benchmarks, and current market trends".
- Be professional, highly encouraging, actionable, and specific. Use markdown formatting.

Here is the candidate's active resume text:
<RESUME_CONTENT>
${resumeText || 'No resume text provided.'}
</RESUME_CONTENT>`;

  const chatHistory = history.map(turn => ({
    role: turn.role === 'user' ? 'user' : 'model',
    parts: [{ text: turn.message }],
  }));

  let lastError = null;
  for (const model of MODELS_TO_TRY) {
    try {
      const chat = genAI.chats.create({
        model,
        history: chatHistory,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      const response = await chat.sendMessage({ message: userMessage });
      if (response && response.text) {
        return response.text;
      }
    } catch (err) {
      console.warn(`[Gemini Chat] Model ${model} failed: ${err.message}. Trying next model...`);
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to generate chat response from Gemini.');
}

module.exports = {
  analyzeResumeWithGemini,
  chatWithGemini
};
