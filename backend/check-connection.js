const mongoose = require('mongoose');
require('dotenv').config();

async function checkConnection() {
  try {
    console.log('Environment variables:');
    console.log('MONGO_URI:', process.env.MONGO_URI || 'Not set');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
    
    const connectionString = process.env.MONGO_URI || 'mongodb://localhost:27017/flower-store';
    console.log('\nConnecting to:', connectionString);
    
    await mongoose.connect(connectionString);
    console.log('✅ Connected successfully!');
    
    // Check database name
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections in database:');
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });
    
    // Check if we're connected to Atlas or local
    const host = mongoose.connection.host;
    console.log('\nConnection host:', host);
    
    if (host.includes('mongodb.net') || host.includes('atlas')) {
      console.log('🌐 Connected to MongoDB Atlas');
    } else {
      console.log('🏠 Connected to local MongoDB');
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected');
  }
}

checkConnection();
