const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Set up OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure Multer for in-memory file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SkillScan AI Backend is running' });
});

// Upload and analyze endpoint
app.post('/api/analyze', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (req.file.mimetype !== 'application/pdf') {
       return res.status(400).json({ error: 'Only PDF files are supported for now' });
    }

    // 1. Extract text from PDF
    const pdfData = await pdfParse(req.file.buffer);
    const textContent = pdfData.text;

    if (!textContent || textContent.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from the provided PDF.' });
    }

    // If no OpenAI key, just return the text to prove extraction worked (useful for testing before adding key)
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
       return res.json({
         ats_score: 72,
         extracted_skills: ['JavaScript (Mock)', 'React (Mock)'],
         missing_competencies: ['TypeScript (Mock)'],
         matched_roles: [{ title: 'Frontend Developer (Mock)', matchPercentage: 85 }],
         suggestions: ['This is a mock response because OPENAI_API_KEY is not set.', 'Add more quantifiable achievements.'],
         skill_development: [
           { skill: "TypeScript", recommendation: "Take a crash course on TypeScript generics and start converting a small React JS project to TS." }
         ]
       });
    }

    // 2. Call OpenAI API for structured JSON extraction
    const prompt = `
      You are an expert technical recruiter and AI resume analyzer.
      Analyze the following resume text and extract the required information in pure JSON format:
      1. 'ats_score': An integer from 0-100 estimating how well this resume would perform in an Applicant Tracking System.
      2. 'extracted_skills': An array of strings representing the technical and soft skills found.
      3. 'missing_competencies': An array of strings representing skills highly valued in the industry but missing from this resume.
      4. 'matched_roles': An array of objects with 'title' (string) and 'matchPercentage' (number 0-100).
      5. 'suggestions': An array of actionable feedback strings to improve the resume.
      6. 'skill_development': An array of objects with 'skill' (string representing the missing skill) and 'recommendation' (string explaining best ways/resources to learn it).

      Resume Text:
      ${textContent.substring(0, 4000)} // truncate to avoid massive token usage for now
      
      Respond EXCLUSIVELY with valid JSON matching the structure.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const resultJsonStr = response.choices[0].message.content;
    const resultJson = JSON.parse(resultJsonStr);

    res.json(resultJson);

  } catch (error) {
    console.error('Error processing resume:', error);
    res.status(500).json({ error: 'Failed to analyze resume', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
