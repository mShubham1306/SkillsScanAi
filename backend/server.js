const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const dotenv = require('dotenv');
const Tesseract = require('tesseract.js');
const { connectDB } = require('./db');
const Resume = require('./models/Resume');
const { analyzeResume, extractSkills } = require('./analyzer/engine');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
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
  res.json({ status: 'ok', message: 'SkillScan AI Backend is running (Local NLP Mode)' });
});

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

    // 3. Run local analysis
    const result = analyzeResume(textContent, allDbResumes);

    // 4. Also store this resume in the database for future comparisons
    const newResume = new Resume({
      fileName: req.file.originalname,
      text: textContent,
      skills: result.extracted_skills
    });
    await newResume.save();

    res.json(result);
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

// ─── Start Server ───────────────────────────────────────────────────────────

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
