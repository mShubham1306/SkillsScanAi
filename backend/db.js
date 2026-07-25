const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillscan';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    const sanitizedURI = MONGODB_URI.includes('@')
      ? MONGODB_URI.replace(/:([^@]+)@/, ':****@')
      : MONGODB_URI;
    console.log('✅ Connected to MongoDB:', sanitizedURI);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('💡 For deployment on Render, please set the MONGODB_URI environment variable (e.g. MongoDB Atlas URI).');
  }
}

module.exports = { connectDB };
