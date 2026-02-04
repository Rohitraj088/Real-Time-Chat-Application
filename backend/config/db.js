const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('\n========================================');
    console.error('MongoDB is not running!');
    console.error('Please either:');
    console.error('1. Start MongoDB locally: mongod');
    console.error('2. Use MongoDB Atlas and update MONGODB_URI in .env');
    console.error('========================================\n');
    process.exit(1);
  }
};

module.exports = connectDB;
