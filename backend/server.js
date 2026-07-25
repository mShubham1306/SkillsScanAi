const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const dotenv = require('dotenv');
const Tesseract = require('tesseract.js');
const { connectDB } = require('./db');
const Resume = require('./models/Resume');
const { analyzeResume, extractSkills, computeCorpusSimilarity } = require('./analyzer/engine');
const { analyzeResumeWithGemini, chatWithGemini } = require('./analyzer/gemini');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000']
  : '*';

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Gemini-Key', 'x-gemini-key']
}));
app.use(express.json());

// Connect to MongoDB
connectDB();

// Configure Multer for in-memory file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit (images can be larger)
});

// ─── Helper: Extract text from file buffer ──────────────────────────────────

async function extractText(file) {
  const mimeType = file.mimetype;

  if (mimeType === 'application/pdf') {
    const pdfData = await pdfParse(file.buffer);
    return pdfData.text;
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  } else if (mimeType === 'text/plain') {
    return file.buffer.toString('utf-8');
  } else if (mimeType.startsWith('image/')) {
    // Use Tesseract.js for local OCR on images (no API key needed)
    console.log(`📷 Running OCR on image: ${file.originalname}...`);
    const { data: { text } } = await Tesseract.recognize(file.buffer, 'eng', {
      logger: (info) => {
        if (info.status === 'recognizing text') {
          console.log(`  OCR progress: ${Math.round(info.progress * 100)}%`);
        }
      }
    });
    console.log(`✅ OCR complete. Extracted ${text.length} characters.`);
    return text;
  } else {
    throw new Error('Unsupported file type. Please upload a PDF, DOCX, TXT, or Image (JPG/PNG) file.');
  }
}

// ─── Health Check ────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  const hasKey = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  res.json({ 
    status: 'ok', 
    message: hasKey ? 'SkillScan AI Backend is running (Gemini AI Mode)' : 'SkillScan AI Backend is running (Local NLP Mode)',
    isBackendKeyAvailable: hasKey
  });
});

// Helper to gather DB context for hybrid comparisons
async function getDbContext() {
  try {
    const resumeCount = await Resume.countDocuments();
    const resumes = await Resume.find({}, 'fileName skills').limit(20).lean();
    
    // Count top skills
    const skillFreq = {};
    for (const r of resumes) {
      if (r.skills) {
        for (const skill of r.skills) {
          skillFreq[skill] = (skillFreq[skill] || 0) + 1;
        }
      }
    }
    const topSkills = Object.entries(skillFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([skill]) => skill);

    return {
      resumeCount,
      topSkills,
      otherResumes: resumes.map(r => ({ fileName: r.fileName, skills: r.skills }))
    };
  } catch (err) {
    console.error('Error gathering database context:', err);
    return { resumeCount: 0, topSkills: [], otherResumes: [] };
  }
}

// ─── Analyze Resume ─────────────────────────────────────────────────────────

app.post('/api/analyze', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // 1. Extract text
    const textContent = await extractText(req.file);

    if (!textContent || textContent.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from the provided file.' });
    }

    // 2. Get all stored resumes from MongoDB for comparison
    const allDbResumes = await Resume.find({}, 'fileName text skills').lean();

    // 3. Check for Gemini Key
    const geminiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;
    
    let result;
    let mode = 'local';

    if (geminiKey && geminiKey.trim().length > 0) {
      try {
        console.log('🤖 Running Gemini AI analysis...');
        const dbContext = await getDbContext();
        const geminiResult = await analyzeResumeWithGemini(textContent, dbContext, geminiKey);
        
        // Compute corpus similarity locally so we keep the hybrid intelligence
        const similarity = computeCorpusSimilarity(textContent, allDbResumes);
        
        result = {
          ...geminiResult,
          corpus_stats: {
            total_resumes_in_db: allDbResumes.length,
            avg_similarity: similarity.avgSimilarity,
            top_similar_resumes: similarity.topMatches
          }
        };
        mode = 'gemini';
        console.log('✅ Gemini analysis complete.');
      } catch (geminiError) {
        console.error('⚠️ Gemini analysis failed, falling back to local NLP:', geminiError.message);
      }
    }

    // Fallback to local NLP if Gemini key is missing or failed
    if (!result) {
      console.log('🧠 Running local NLP analysis...');
      result = analyzeResume(textContent, allDbResumes);
    }

    // 4. Store this resume in the database for future comparisons
    const newResume = new Resume({
      fileName: req.file.originalname,
      text: textContent,
      skills: result.extracted_skills
    });
    const savedResume = await newResume.save();

    // Attach resume ID and analysis mode for chatbot context
    res.json({
      ...result,
      resumeId: savedResume._id,
      fileName: savedResume.fileName,
      mode
    });
  } catch (error) {
    console.error('Error processing resume:', error);
    res.status(500).json({ error: 'Failed to analyze resume', details: error.message });
  }
});

// ─── Seed Multiple Resumes ──────────────────────────────────────────────────

app.post('/api/seed', upload.array('resumes', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = { stored: 0, failed: 0, errors: [] };

    for (const file of req.files) {
      try {
        const textContent = await extractText(file);

        if (!textContent || textContent.trim().length === 0) {
          results.failed++;
          results.errors.push(`${file.originalname}: Could not extract text`);
          continue;
        }

        const skills = extractSkills(textContent);

        const resume = new Resume({
          fileName: file.originalname,
          text: textContent,
          skills: skills
        });
        await resume.save();
        results.stored++;
      } catch (err) {
        results.failed++;
        results.errors.push(`${file.originalname}: ${err.message}`);
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error seeding resumes:', error);
    res.status(500).json({ error: 'Failed to seed resumes', details: error.message });
  }
});

// ─── Get Stats ──────────────────────────────────────────────────────────────

app.get('/api/stats', async (req, res) => {
  try {
    const resumeCount = await Resume.countDocuments();
    const resumes = await Resume.find({}, 'skills').lean();

    // Count skill frequencies
    const skillFreq = {};
    for (const resume of resumes) {
      for (const skill of resume.skills) {
        skillFreq[skill] = (skillFreq[skill] || 0) + 1;
      }
    }

    const topSkills = Object.entries(skillFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([skill, count]) => ({ skill, count }));

    res.json({ resumeCount, topSkills });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── Get Stored Resumes List ────────────────────────────────────────────────

app.get('/api/resumes', async (req, res) => {
  try {
    const resumes = await Resume.find({}, 'fileName skills uploadedAt')
      .sort({ uploadedAt: -1 })
      .lean();

    res.json(resumes);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// ─── Delete a Resume ────────────────────────────────────────────────────────

app.delete('/api/resumes/:id', async (req, res) => {
  try {
    await Resume.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

// ─── Chat with Resume Context ───────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  try {
    const { message, resumeId, history } = req.body;
    const geminiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;

    if (!geminiKey || geminiKey.trim().length === 0) {
      return res.status(400).json({ error: 'Gemini API Key is required for AI Chatbot.' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    let resumeText = '';
    if (resumeId) {
      const resume = await Resume.findById(resumeId);
      if (resume) {
        resumeText = resume.text;
      }
    }

    const dbContext = await getDbContext();
    const reply = await chatWithGemini(message, history || [], resumeText, dbContext, geminiKey);
    res.json({ reply });
  } catch (error) {
    console.error('Error in chat API:', error);
    res.status(500).json({ error: 'Failed to generate chat response', details: error.message });
  }
});

// ─── Start Server ───────────────────────────────────────────────────────────

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
