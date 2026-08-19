const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'fuelgo';

async function connectMongoDB() {
  try {
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI is not defined in .env');
      return;
    }

    const conn = await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
      family: 4,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host} (DB: ${MONGODB_DB_NAME})`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.warn('⚠️ Server will continue to run without MongoDB (some auth features may fail).');
    // process.exit(1); // Do not crash the entire server
  }
}

module.exports = connectMongoDB;
