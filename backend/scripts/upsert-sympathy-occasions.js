const mongoose = require('mongoose');
const Occasion = require('../models/Occasion');

async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/flower-store';
  console.log('Connecting to Mongo...', uri.replace(/\/\/.*@/, '//***:***@'));
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('✅ Connected');
}

async function upsertOccasionByName(name, extra = {}) {
  let occasion = await Occasion.findOne({ name });
  if (occasion) {
    Object.assign(occasion, { isActive: true, ...extra });
    await occasion.save();
    console.log(`✅ Ensured occasion active: ${name}`);
    return occasion;
  }
  occasion = new Occasion({ name, isActive: true, ...extra });
  await occasion.save();
  console.log(`✅ Created occasion: ${name}`);
  return occasion;
}

async function deactivateOccasionByName(name) {
  const occasion = await Occasion.findOne({ name });
  if (!occasion) {
    console.log(`ℹ️  Occasion not found (skip deactivate): ${name}`);
    return;
  }
  if (occasion.isActive) {
    occasion.isActive = false;
    await occasion.save();
    console.log(`✅ Deactivated occasion: ${name}`);
  } else {
    console.log(`ℹ️  Occasion already inactive: ${name}`);
  }
}

async function main() {
  try {
    await connectDB();

    // Ensure sympathy categories exist and are active
    await upsertOccasionByName('Wreaths', { color: '#607D8B' });
    await upsertOccasionByName('Casket Sprays', { color: '#607D8B' });
    await upsertOccasionByName('Sympathy Bouquets', { color: '#607D8B' });

    // Deactivate top-level Sympathy category
    await deactivateOccasionByName('Sympathy');

    console.log('✅ Upsert complete');
  } catch (err) {
    console.error('❌ Upsert failed', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

if (require.main === module) {
  main();
}


