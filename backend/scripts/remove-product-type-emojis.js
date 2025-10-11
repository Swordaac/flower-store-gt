const mongoose = require('mongoose');
const ProductType = require('../models/ProductType');

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

// Function to remove emojis from product types
const removeEmojis = async () => {
  try {
    console.log('\n🔄 Removing emojis from product types...');
    
    // Get all product types
    const productTypes = await ProductType.find({});
    console.log(`Found ${productTypes.length} product types`);
    
    let updatedCount = 0;
    
    for (const productType of productTypes) {
      if (productType.icon && productType.icon.trim() !== '') {
        console.log(`Removing emoji from "${productType.name}": ${productType.icon}`);
        productType.icon = '';
        await productType.save();
        updatedCount++;
      }
    }
    
    console.log(`✅ Removed emojis from ${updatedCount} product types`);
    
    // Display final product types
    console.log('\n📋 Final product types (without emojis):');
    const finalTypes = await ProductType.find({}).sort({ sortOrder: 1 });
    finalTypes.forEach(type => {
      console.log(`   ${type.sortOrder}. ${type.name} (${type.color})`);
    });
    
    console.log('\n✅ Emoji removal completed successfully!');
    
  } catch (error) {
    console.error('❌ Error removing emojis:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await removeEmojis();
  } catch (error) {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { removeEmojis };
