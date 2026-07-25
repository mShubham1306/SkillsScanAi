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
 * @param {object} dbContext - Context about other resumes in the DB
 * @param {string} apiKey - Groq API Key (gsk_...)
 */
async function analyzeResumeWithGroq(resumeText, dbContext, apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    throw new Error('Invalid or missing Groq API Key.');
  }

  const groq = new Groq({ apiKey: apiKey.trim() });

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

  const systemPrompt = `You are a helpful, professional AI Career Coach and Resume Assistant at SkillScan AI.
You are helping the user analyze their resume, recommend job titles, identify skill gaps, and improve their profile.

Here is the ACTIVE resume content you are discussing:
<ACTIVE_RESUME>
${resumeText || 'No resume text provided.'}
</ACTIVE_RESUME>

Here is the global DATABASE context:
<DATABASE_CONTEXT>
Total resumes in database: ${dbContext.resumeCount || 0}
Common skills in database: ${JSON.stringify(dbContext.topSkills || [])}
</DATABASE_CONTEXT>

Be specific, actionable, and conversational. Use markdown formatting.`;

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
