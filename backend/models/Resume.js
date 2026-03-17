const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  skills: {
    type: [String],
    default: []
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for text search
resumeSchema.index({ text: 'text' });

module.exports = mongoose.model('Resume', resumeSchema);
