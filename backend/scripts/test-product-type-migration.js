const mongoose = require('mongoose');
const ProductType = require('../models/ProductType');
const Product = require('../models/Product');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/flower-store';
    console.log('Connecting to MongoDB...');
    console.log('URI:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in log
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Test function to check current state
const testCurrentState = async () => {
  try {
    console.log('\n🔍 Checking current database state...');
    
    // Get current product types
    const currentTypes = await ProductType.find({}).sort({ sortOrder: 1 });
    console.log(`\n📋 Current product types (${currentTypes.length}):`);
    currentTypes.forEach(type => {
      console.log(`   ${type.sortOrder}. ${type.name} (${type.color}) ${type.icon || ''}`);
    });
    
    // Get products with product types
    const productsWithTypes = await Product.find({ productTypes: { $exists: true, $ne: [] } });
    console.log(`\n📦 Products with product types (${productsWithTypes.length}):`);
    
    for (const product of productsWithTypes.slice(0, 5)) { // Show first 5 products
      const productTypeNames = [];
      for (const typeId of product.productTypes) {
        const type = currentTypes.find(t => t._id.toString() === typeId.toString());
        if (type) {
          productTypeNames.push(type.name);
        }
      }
      console.log(`   - "${product.name}": [${productTypeNames.join(', ')}]`);
    }
    
    if (productsWithTypes.length > 5) {
      console.log(`   ... and ${productsWithTypes.length - 5} more products`);
    }
    
    // Check for products without product types
    const productsWithoutTypes = await Product.find({ 
      $or: [
        { productTypes: { $exists: false } },
        { productTypes: { $size: 0 } }
      ]
    });
    
    if (productsWithoutTypes.length > 0) {
      console.log(`\n⚠️  Products without product types (${productsWithoutTypes.length}):`);
      productsWithoutTypes.slice(0, 3).forEach(product => {
        console.log(`   - "${product.name}"`);
      });
      if (productsWithoutTypes.length > 3) {
        console.log(`   ... and ${productsWithoutTypes.length - 3} more`);
      }
    }
    
    console.log('\n✅ Database state check completed');
    
  } catch (error) {
    console.error('❌ Error checking database state:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await testCurrentState();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the test
if (require.main === module) {
  main();
}

module.exports = { testCurrentState };
