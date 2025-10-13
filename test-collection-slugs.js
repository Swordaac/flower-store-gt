const mongoose = require('mongoose');
const ProductType = require('./backend/models/ProductType');
const Occasion = require('./backend/models/Occasion');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/flower-store';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function testSlugGeneration() {
  try {
    console.log('🔍 Testing slug generation...\n');

    // Get all product types
    const productTypes = await ProductType.find({ isActive: true }).sort({ sortOrder: 1 });
    console.log('📋 Product Types:');
    productTypes.forEach(type => {
      const generatedSlug = type.slug || type.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      console.log(`   - ${type.name} → slug: "${generatedSlug}"`);
    });

    console.log('\n🎉 Occasions:');
    const occasions = await Occasion.find({ isActive: true }).sort({ sortOrder: 1 });
    occasions.forEach(occasion => {
      const generatedSlug = occasion.slug || occasion.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      console.log(`   - ${occasion.name} → slug: "${generatedSlug}"`);
    });

    console.log('\n🔗 Navigation Links Test:');
    const navLinks = [
      '/collections/rose',
      '/collections/bouquet', 
      '/collections/bouquet-in-vase',
      '/collections/birthday',
      '/collections/anniversary',
      '/collections/love-romantic',
      '/collections/get-well',
      '/collections/wedding',
      '/collections/prom',
      '/collections/congratulations',
      '/collections/new-baby',
      '/collections/grand-opening',
      '/collections/wreaths',
      '/collections/casket-sprays',
      '/collections/sympathy-bouquets'
    ];

    navLinks.forEach(link => {
      const slug = link.replace('/collections/', '');
      const typeMatch = productTypes.find(t => (t.slug || t.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')) === slug);
      const occasionMatch = occasions.find(o => (o.slug || o.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')) === slug);
      
      if (typeMatch) {
        console.log(`   ✅ ${link} → Product Type: ${typeMatch.name}`);
      } else if (occasionMatch) {
        console.log(`   ✅ ${link} → Occasion: ${occasionMatch.name}`);
      } else {
        console.log(`   ❌ ${link} → No match found`);
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await testSlugGeneration();
  } catch (error) {
    console.error('💥 Test process failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

main();
