const mongoose = require('mongoose');
require('dotenv').config();

// Import the Product model
const Product = require('../models/Product');

async function createTestProduct() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/flower-store');
    console.log('Connected to MongoDB');

    // Check if test product already exists
    const existingProduct = await Product.findOne({ name: 'Test Flower Bouquet' });
    if (existingProduct) {
      console.log('Test product already exists:', existingProduct._id);
      return existingProduct._id;
    }

    // Create test product
    const testProduct = new Product({
      name: 'Test Flower Bouquet',
      description: 'A beautiful test bouquet for testing checkout',
      color: 'Mixed',
      price: {
        standard: 2500, // $25.00 in cents
        deluxe: 3500,   // $35.00 in cents
        premium: 4500   // $45.00 in cents
      },
      stock: 10,
      category: ['bouquet'],
      shopId: '68bee99274d623bf005e3519', // The default shop we created
      isActive: true,
      images: [{
        size: 'medium',
        url: 'https://via.placeholder.com/300x300?text=Test+Flower',
        alt: 'Test Flower Bouquet'
      }],
      tags: ['test', 'bouquet', 'flowers']
    });

    const savedProduct = await testProduct.save();
    console.log('Test product created successfully:', savedProduct._id);
    console.log('Product name:', savedProduct.name);
    console.log('Product price:', savedProduct.price);
    
    return savedProduct._id;
  } catch (error) {
    console.error('Error creating test product:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
createTestProduct();
