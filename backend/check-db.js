const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Product = require('./models/Product');
const ProductType = require('./models/ProductType');
const Occasion = require('./models/Occasion');

async function checkDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/flower-store');
    console.log('Connected to MongoDB');

    // Check ProductTypes
    console.log('\n=== PRODUCT TYPES ===');
    const productTypes = await ProductType.find({});
    console.log(`Total ProductTypes: ${productTypes.length}`);
    productTypes.forEach(pt => {
      console.log(`- ${pt.name} (ID: ${pt._id}) - Active: ${pt.isActive}`);
    });

    // Check Occasions
    console.log('\n=== OCCASIONS ===');
    const occasions = await Occasion.find({});
    console.log(`Total Occasions: ${occasions.length}`);
    occasions.forEach(occ => {
      console.log(`- ${occ.name} (ID: ${occ._id}) - Active: ${occ.isActive}`);
    });

    // Check Products
    console.log('\n=== PRODUCTS ===');
    const products = await Product.find({});
    console.log(`Total Products: ${products.length}`);
    products.forEach(product => {
      console.log(`- ${product.name} (ID: ${product._id})`);
      console.log(`  ProductTypes: ${product.productTypes.length}`);
      console.log(`  Occasions: ${product.occasions.length}`);
      console.log(`  Variants: ${product.variants.length}`);
    });

    // Check specific product with populated data
    if (products.length > 0) {
      console.log('\n=== DETAILED PRODUCT INFO ===');
      const detailedProduct = await Product.findById(products[0]._id)
        .populate('productTypes', 'name color')
        .populate('occasions', 'name color');
      
      console.log(`Product: ${detailedProduct.name}`);
      console.log('ProductTypes:', detailedProduct.productTypes.map(pt => `${pt.name} (${pt.color})`));
      console.log('Occasions:', detailedProduct.occasions.map(occ => `${occ.name} (${occ.color})`));
      console.log('Variants:', detailedProduct.variants.map(v => `${v.tierName}: $${v.price/100} (stock: ${v.stock})`));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkDatabase();
