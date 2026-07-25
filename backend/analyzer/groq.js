/**
 * Groq AI Integration Service
 * Uses the Groq SDK with Llama models — free tier: 14,400 req/day
 */

const Groq = require('groq-sdk');

const MODELS_TO_TRY = [
  'llama-3.3-70b-versatile',   // Best quality, 32k context
  'llama-3.1-8b-instant',       // Fastest fallback
  'gemma2-9b-it',               // Google's Gemma via Groq
];

/**
 * Analyze a resume using Groq/Llama.
 * @param {string} resumeText - Full text of the resume
 * @param {object} dbContext - Context about industry skills/trends
 * @param {string} apiKey - Groq API Key (gsk_...)
 */
async function analyzeResumeWithGroq(resumeText, dbContext, apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    throw new Error('Invalid or missing Groq API Key.');
  }

  const groq = new Groq({ apiKey: apiKey.trim() });

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

Return ONLY the JSON object. No markdown, no explanation.`;

  let lastError = null;
  for (const model of MODELS_TO_TRY) {
    try {
      console.log(`🦙 Trying Groq model: ${model}...`);
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        model,
        temperature: 0.2,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      });

      const text = completion.choices[0]?.message?.content;
      if (!text) throw new Error('Empty response from Groq');

      console.log(`✅ Groq analysis complete (${model}).`);
      return JSON.parse(text);
    } catch (err) {
      console.warn(`[Groq] Model ${model} failed: ${err.message}. Trying next...`);
      lastError = err;
    }
  }

  throw lastError || new Error('All Groq models failed.');
}

/**
 * Chat with Groq about a resume.
 * @param {string} userMessage - User's chat message
 * @param {Array} history - [{ role: 'user'|'model', message: string }]
 * @param {string} resumeText - Active resume text
 * @param {object} dbContext - DB info
 * @param {string} apiKey - Groq API Key
 */
async function chatWithGroq(userMessage, history = [], resumeText, dbContext, apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    throw new Error('Invalid or missing Groq API Key.');
  }

  const groq = new Groq({ apiKey: apiKey.trim() });

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
    role: turn.role === 'user' ? 'user' : 'assistant',
    content: turn.message,
  }));

  let lastError = null;
  for (const model of MODELS_TO_TRY) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...chatHistory,
          { role: 'user', content: userMessage },
        ],
        model,
        temperature: 0.7,
        max_tokens: 1024,
      });

      const text = completion.choices[0]?.message?.content;
      if (!text) throw new Error('Empty response from Groq');
      return text;
    } catch (err) {
      console.warn(`[Groq Chat] Model ${model} failed: ${err.message}. Trying next...`);
      lastError = err;
    }
  }

  throw lastError || new Error('All Groq models failed for chat.');
}

module.exports = { analyzeResumeWithGroq, chatWithGroq };
