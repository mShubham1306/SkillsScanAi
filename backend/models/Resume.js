const mongoose = require('mongoose');

const matchedRoleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  matchPercentage: { type: Number, required: true }
}, { _id: false });

const skillRecommendationSchema = new mongoose.Schema({
  skill: { type: String, required: true },
  recommendation: { type: String, required: true }
}, { _id: false });

const analysisReportSchema = new mongoose.Schema({
  ats_score: { type: Number, min: 0, max: 100 },
  missing_competencies: [{ type: String }],
  matched_roles: [matchedRoleSchema],
  suggestions: [{ type: String }],
  skill_development: [skillRecommendationSchema],
  executive_summary: { type: String }
}, { _id: false });

const resumeSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  text: {
    type: String,
    required: true
  },
  skills: {
    type: [String],
    default: [],
    index: true
  },
  analysisReport: {
    type: analysisReportSchema,
    default: null
  },
  fileSize: {
    type: Number,
    default: 0
  },
  mimeType: {
    type: String,
    default: 'application/pdf'
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Full-text search index on resume text and skills
resumeSchema.index({ text: 'text', skills: 'text' });

module.exports = mongoose.model('Resume', resumeSchema);
