const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillscan';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB:', MONGODB_URI);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Make sure MongoDB is running on localhost:27017');
    process.exit(1);
  }
}

module.exports = { connectDB };
