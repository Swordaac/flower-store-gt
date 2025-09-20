const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductType = require('../models/ProductType');
const Occasion = require('../models/Occasion');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB Atlas
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/flower-store';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// New data structure
const newProductTypes = [
  {
    name: 'Orchid',
    description: 'Beautiful orchid arrangements',
    color: '#E91E63',
    icon: '🌸',
    sortOrder: 1
  },
  {
    name: 'Rose Only',
    description: 'Classic rose bouquets',
    color: '#F44336',
    icon: '🌹',
    sortOrder: 2
  },
  {
    name: 'Indoor Plant',
    description: 'Indoor plants and arrangements',
    color: '#4CAF50',
    icon: '🌱',
    sortOrder: 3
  }
];

const newOccasions = [
  {
    name: 'Birthday',
    description: 'Celebrate special birthdays',
    color: '#FF9800',
    icon: '🎂',
    sortOrder: 1,
    sympathy: []
  },
  {
    name: 'Get Well Soon',
    description: 'Wish someone a speedy recovery',
    color: '#9C27B0',
    icon: '💐',
    sortOrder: 2,
    sympathy: []
  },
  {
    name: 'Anniversary',
    description: 'Celebrate special anniversaries',
    color: '#E91E63',
    icon: '💕',
    sortOrder: 3,
    sympathy: []
  },
  {
    name: 'Sympathy',
    description: 'Express condolences and sympathy',
    color: '#607D8B',
    icon: '🕊️',
    sortOrder: 4,
    sympathy: ['Wreaths', 'Casket Sprays', 'Funeral Bouquet']
  },
  {
    name: 'Congratulation',
    description: 'Celebrate achievements and milestones',
    color: '#4CAF50',
    icon: '🎉',
    sortOrder: 5,
    sympathy: []
  },
  {
    name: 'Wedding',
    description: 'Wedding flowers and arrangements',
    color: '#FFC107',
    icon: '💒',
    sortOrder: 6,
    sympathy: []
  },
  {
    name: 'New Baby',
    description: 'Welcome new additions to the family',
    color: '#00BCD4',
    icon: '👶',
    sortOrder: 7,
    sympathy: []
  }
];

async function migrateDatabase() {
  try {
    console.log('🚀 Starting database migration...\n');

    // Step 1: Clear existing product types and occasions
    console.log('1️⃣ Clearing existing product types and occasions...');
    await ProductType.deleteMany({});
    await Occasion.deleteMany({});
    console.log('✅ Cleared existing data\n');

    // Step 2: Create new product types
    console.log('2️⃣ Creating new product types...');
    const createdProductTypes = await ProductType.insertMany(newProductTypes);
    console.log(`✅ Created ${createdProductTypes.length} product types:`);
    createdProductTypes.forEach(type => {
      console.log(`   - ${type.name} (${type.color})`);
    });
    console.log('');

    // Step 3: Create new occasions
    console.log('3️⃣ Creating new occasions...');
    const createdOccasions = await Occasion.insertMany(newOccasions);
    console.log(`✅ Created ${createdOccasions.length} occasions:`);
    createdOccasions.forEach(occasion => {
      console.log(`   - ${occasion.name} (${occasion.color})`);
      if (occasion.sympathy && occasion.sympathy.length > 0) {
        console.log(`     Sympathy categories: ${occasion.sympathy.join(', ')}`);
      }
    });
    console.log('');

    // Step 4: Update existing products
    console.log('4️⃣ Updating existing products...');
    
    // Add isBestSeller field to all products (default to false)
    const updateResult = await Product.updateMany(
      { isBestSeller: { $exists: false } },
      { $set: { isBestSeller: false } }
    );
    console.log(`✅ Added isBestSeller field to ${updateResult.modifiedCount} products`);

    // Get all products to show current state
    const productCount = await Product.countDocuments();
    const bestSellerCount = await Product.countDocuments({ isBestSeller: true });
    console.log(`📊 Total products: ${productCount}`);
    console.log(`⭐ Best sellers: ${bestSellerCount}`);
    console.log('');

    // Step 5: Show migration summary
    console.log('🎉 Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Product Types: ${createdProductTypes.length}`);
    console.log(`   - Occasions: ${createdOccasions.length}`);
    console.log(`   - Products updated: ${updateResult.modifiedCount}`);
    console.log('\n🔧 Next steps:');
    console.log('   1. Update your products to assign correct product types and occasions');
    console.log('   2. Mark products as best sellers where appropriate');
    console.log('   3. Test the new filtering functionality');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await migrateDatabase();
  } catch (error) {
    console.error('💥 Migration process failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run migration
main();
