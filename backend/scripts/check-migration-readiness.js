const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

async function checkMigrationReadiness() {
  console.log('🔍 Checking migration readiness...\n');

  // Check environment variables
  console.log('1️⃣ Checking environment configuration:');
  const mongoURI = process.env.MONGO_URI;
  
  if (!mongoURI) {
    console.log('❌ MONGO_URI not found in environment variables');
    console.log('   Please ensure your .env file contains: MONGO_URI=mongodb+srv://...');
    return false;
  }
  
  if (mongoURI.includes('localhost')) {
    console.log('⚠️  Warning: Using localhost MongoDB. Make sure this is correct for your setup.');
  } else {
    console.log('✅ MONGO_URI found and appears to be MongoDB Atlas');
  }
  console.log('');

  // Test database connection
  console.log('2️⃣ Testing database connection:');
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Successfully connected to MongoDB');
    
    // Check if we can access the database
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections in database`);
    
    // Check for existing collections
    const collectionNames = collections.map(c => c.name);
    console.log('   Collections:', collectionNames.join(', '));
    
    await mongoose.connection.close();
    console.log('✅ Database connection test passed\n');
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('   Please check your MongoDB Atlas connection string and network access');
    return false;
  }

  // Check required models
  console.log('3️⃣ Checking required models:');
  try {
    const Product = require('../models/Product');
    const ProductType = require('../models/ProductType');
    const Occasion = require('../models/Occasion');
    console.log('✅ All required models loaded successfully');
  } catch (error) {
    console.log('❌ Error loading models:', error.message);
    return false;
  }

  console.log('\n🎉 Migration readiness check completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('   1. Run: node scripts/analyze-existing-data.js');
  console.log('   2. Run: node scripts/migrate-to-new-structure.js');
  console.log('   3. Run: node scripts/map-existing-data.js (if needed)');
  
  return true;
}

async function main() {
  try {
    const isReady = await checkMigrationReadiness();
    if (!isReady) {
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Check failed:', error);
    process.exit(1);
  }
}

main();
