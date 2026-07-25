/**
 * Gemini API Integration Service
 * Uses the official @google/genai SDK with multi-model fallback support.
 */

const { GoogleGenAI } = require('@google/genai');

const MODELS_TO_TRY = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash-8b'];

/**
 * Helper to call generateContent with model fallbacks.
 */
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
 * @param {string} resumeText - Full text of the resume
 * @param {object} dbContext - Context about other resumes in the DB
 * @param {string} apiKey - Gemini API Key
 */
async function analyzeResumeWithGemini(resumeText, dbContext, apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    throw new Error('Invalid or missing Gemini API Key.');
  }

  const genAI = new GoogleGenAI({ apiKey: apiKey.trim() });

  const systemPrompt = `You are an expert Applicant Tracking System (ATS) and career coach.
Analyze the candidate's resume text and match it against industry standards.
You also have access to context about other resumes stored in the database for benchmark comparisons.

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

  const userMessage = `Here is the resume text to analyze:
---
${resumeText}
---

Here is the database corpus context (for benchmarking/comparison):
---
Total Resumes in DB: ${dbContext.resumeCount || 0}
Top Skills in DB: ${JSON.stringify(dbContext.topSkills || [])}
Other resumes in DB: ${JSON.stringify(dbContext.otherResumes || [])}
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

/**
 * Clean and parse JSON from model response.
 */
function cleanAndParseJSON(rawText) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  return JSON.parse(cleaned.trim());
}

/**
 * Chat with Gemini about a resume.
 * @param {string} userMessage - User's chat message
 * @param {Array} history - [{ role: 'user'|'model', message: string }]
 * @param {string} resumeText - Active resume text
 * @param {object} dbContext - DB info
 * @param {string} apiKey - Gemini API Key
 */
async function chatWithGemini(userMessage, history = [], resumeText, dbContext, apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    throw new Error('Invalid or missing Gemini API Key.');
  }

  const genAI = new GoogleGenAI({ apiKey: apiKey.trim() });

  const systemPrompt = `You are a helpful, professional AI Career Coach and Resume Assistant at SkillScan AI.
You are helping the user analyze their resume, recommend job titles, identify skill gaps, and improve their profile.

Here is the ACTIVE resume content you are discussing:
<ACTIVE_RESUME>
${resumeText || 'No resume text provided.'}
</ACTIVE_RESUME>

Here is the global DATABASE context (trends and other resumes uploaded by this user):
<DATABASE_CONTEXT>
Total resumes in database: ${dbContext.resumeCount || 0}
Other resume files in database: ${JSON.stringify(dbContext.otherResumes || [])}
Common skills in database: ${JSON.stringify(dbContext.topSkills || [])}
</DATABASE_CONTEXT>

Use this context to answer the user's questions. Compare their resume to others in the database when asked.
Be specific, actionable, and conversational. Use markdown formatting.`;

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
