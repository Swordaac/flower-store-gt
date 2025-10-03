const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
const Shop = require('./models/Shop');
const Product = require('./models/Product');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testApiOrderCreation() {
  console.log('🧪 Testing API Order Creation with Auto-Printing...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get test data
    const user = await User.findOne({ role: 'customer' });
    const shop = await Shop.findOne({ isActive: true });
    const product = await Product.findOne({ shopId: shop._id });

    if (!user || !shop || !product) {
      console.log('❌ Missing required data. Please ensure you have users, shops, and products.');
      return;
    }

    console.log('✅ Found user:', user.email);
    console.log('✅ Found shop:', shop.name);
    console.log('✅ Found product:', product.name);

    // Generate JWT token
    const token = jwt.sign(
      { 
        _id: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Prepare order data
    const orderData = {
      shopId: shop._id.toString(),
      items: [
        {
          productId: product._id.toString(),
          quantity: 1
        }
      ],
      delivery: {
        method: 'delivery',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          province: 'QC',
          postalCode: 'H1A 1A1',
          country: 'Canada'
        },
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        time: '14:00',
        specialInstructions: 'Please ring doorbell twice',
        contactPhone: '+1234567890',
        contactEmail: 'test@example.com'
      },
      recipient: {
        name: 'Test Recipient',
        phone: '+1234567890',
        email: 'test@example.com'
      },
      notes: 'Test order for auto-printing via API'
    };

    console.log('\n📝 Creating order via API...');
    console.log('Order data:', JSON.stringify(orderData, null, 2));

    // Make API request
    const response = await axios.post('http://localhost:5000/api/orders', orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ API Response:', response.status, response.data.message);
    console.log('Order created:', response.data.data.orderNumber);

    // Wait a moment for the print job to be processed
    console.log('\n⏳ Waiting for print job to be processed...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Clean up - delete the test order
    console.log('\n🧹 Cleaning up test order...');
    const Order = require('./models/Order');
    await Order.findByIdAndDelete(response.data.data._id);
    console.log('✅ Test order deleted');

    console.log('\n🎉 API order creation test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n📝 MongoDB connection closed');
  }
}

// Run the test
if (require.main === module) {
  testApiOrderCreation();
}

module.exports = testApiOrderCreation;
