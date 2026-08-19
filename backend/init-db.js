require('dotenv').config();
const mongoose = require('mongoose');

// Import all models to ensure schemas are registered
require('./models/User');
require('./models/Order');
require('./models/LogModels');

async function initializeDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || 'fuelgo',
      serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds instead of 30
      family: 4 // Force IPv4
    });
    
    console.log('✅ Connected successfully!');
    
    // In MongoDB, collections are created automatically when the first document is inserted.
    // We can also explicitly create them if they don't exist.
    const models = mongoose.modelNames();
    console.log(`Checking collections for models: ${models.join(', ')}`);
    
    for (const modelName of models) {
      const model = mongoose.model(modelName);
      // Explicitly create the collection
      await model.createCollection();
      console.log(`✅ Collection created/verified for model: ${modelName}`);
    }

    console.log('🎉 All tables (collections) have been successfully initialized!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to initialize database.');
    console.error('Error Details:', error.message);
    
    if (error.message.includes('ECONNREFUSED') || error.name === 'MongoServerSelectionError') {
      console.log('\n--- HOW TO FIX ---');
      console.log('1. Go to your MongoDB Atlas dashboard (https://cloud.mongodb.com)');
      console.log('2. Click on "Network Access" in the left sidebar.');
      console.log('3. Click "Add IP Address".');
      console.log('4. Click "Allow Access From Anywhere" (0.0.0.0/0) OR "Add Current IP Address".');
      console.log('5. Confirm and wait 1-2 minutes for the status to become Active.');
      console.log('6. Run this script again: node init-db.js');
    }
    process.exit(1);
  }
}

initializeDatabase();
