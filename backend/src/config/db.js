require('dotenv').config();

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Default to localhost if MONGODB_URI not set
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bkforum';

    if (!process.env.MONGODB_URI) {
      console.warn('⚠️  MONGODB_URI not set in .env, using default: mongodb://localhost:27017/bkforum');
    }

    const conn = await mongoose.connect(mongoUri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('   Make sure MongoDB is running and MONGODB_URI is correct in .env file');
    process.exit(1);
  }
};

module.exports = connectDB;


