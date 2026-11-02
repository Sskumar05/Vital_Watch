// =============================================================
//  Database Connection Configuration (MongoDB / Mongoose)
// =============================================================

const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/patient_monitor';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[DB] MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`[DB] MongoDB Connection Error: ${err.message}`);
    console.warn(`[DB] Please verify your MongoDB service is running or check MONGODB_URI in .env`);
    // Do not crash the entire process so that health checks and diagnostics can run
    return null;
  }
};

module.exports = connectDB;

