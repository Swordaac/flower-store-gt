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

async function analyzeExistingData() {
  try {
    console.log('🔍 Analyzing existing data...\n');

    // Analyze products
    const totalProducts = await Product.countDocuments();
    console.log(`📦 Total products: ${totalProducts}`);

    if (totalProducts > 0) {
      // Check for existing product types
      const productsWithTypes = await Product.find({ productTypes: { $exists: true, $ne: [] } });
      console.log(`🏷️  Products with product types: ${productsWithTypes.length}`);

      // Check for existing occasions
      const productsWithOccasions = await Product.find({ occasions: { $exists: true, $ne: [] } });
      console.log(`🎉 Products with occasions: ${productsWithOccasions.length}`);

      // Check for best seller field
      const productsWithBestSeller = await Product.find({ isBestSeller: { $exists: true } });
      console.log(`⭐ Products with best seller field: ${productsWithBestSeller.length}`);

      // Check for legacy category field
      const productsWithCategory = await Product.find({ category: { $exists: true, $ne: [] } });
      console.log(`📂 Products with legacy category: ${productsWithCategory.length}`);

      if (productsWithCategory.length > 0) {
        console.log('\n📋 Legacy categories found:');
        const categories = await Product.distinct('category');
        categories.forEach(cat => {
          if (Array.isArray(cat)) {
            cat.forEach(c => console.log(`   - ${c}`));
          } else {
            console.log(`   - ${cat}`);
          }
        });
      }

      // Sample products for review
      console.log('\n📄 Sample products:');
      const sampleProducts = await Product.find({}).limit(3).select('name productTypes occasions category isBestSeller');
      sampleProducts.forEach((product, index) => {
        console.log(`\n   Product ${index + 1}: ${product.name}`);
        console.log(`   - Product Types: ${product.productTypes?.length || 0}`);
        console.log(`   - Occasions: ${product.occasions?.length || 0}`);
        console.log(`   - Legacy Categories: ${product.category?.length || 0}`);
        console.log(`   - Best Seller: ${product.isBestSeller || false}`);
      });
    }

    // Analyze existing product types
    const existingProductTypes = await ProductType.find({});
    console.log(`\n🏷️  Existing product types: ${existingProductTypes.length}`);
    if (existingProductTypes.length > 0) {
      existingProductTypes.forEach(type => {
        console.log(`   - ${type.name}`);
      });
    }

    // Analyze existing occasions
    const existingOccasions = await Occasion.find({});
    console.log(`\n🎉 Existing occasions: ${existingOccasions.length}`);
    if (existingOccasions.length > 0) {
      existingOccasions.forEach(occasion => {
        console.log(`   - ${occasion.name}`);
        if (occasion.sympathy && occasion.sympathy.length > 0) {
          console.log(`     Sympathy: ${occasion.sympathy.join(', ')}`);
        }
      });
    }

    console.log('\n✅ Analysis complete!');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await analyzeExistingData();
  } catch (error) {
    console.error('💥 Analysis process failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run analysis
main();
