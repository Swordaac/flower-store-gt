const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testApiWithFixedJWT() {
  console.log('🧪 Testing API Order Creation with Fixed JWT...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get the specific user
    const user = await User.findOne({ email: 'buyer@mail.mcgill.ca' });

    if (!user) {
      console.log('❌ User buyer@mail.mcgill.ca not found');
      return;
    }

    console.log('✅ Found user:', user.email);

    // Use mock token for development testing
    const token = 'mock-token-for-testing';

    console.log('✅ Using mock token for testing');

    // Use the exact order data provided
    const orderData = {
      "shopId": "68c34f45ee89e0fd81c8aa4d",
      "items": [
        {
          "productId": "68c34f62ee89e0fd81c8aaa3",
          "quantity": 1
        }
      ],
      "delivery": {
        "method": "delivery",
        "address": {
          "street": "123 Test Street",
          "city": "Test City",
          "province": "QC",
          "postalCode": "H1A 1A1",
          "country": "Canada"
        },
        "date": "2025-10-04T20:46:18.291Z",
        "time": "14:00",
        "specialInstructions": "Please ring doorbell twice",
        "contactPhone": "+1234567890",
        "contactEmail": "test@example.com"
      },
      "recipient": {
        "name": "Test Recipient",
        "phone": "+1234567890",
        "email": "test@example.com"
      },
      "notes": "Test order for auto-printing via API"
    };

    console.log('\n📝 Creating order via API...');
    console.log('Order data:', JSON.stringify(orderData, null, 2));

    // Make API request to port 5001
    const response = await axios.post('http://localhost:5001/api/orders', orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ API Response:', response.status, response.data.message);
    console.log('Order created:', response.data.data.orderNumber);

    // Wait a moment for the print job to be processed
    console.log('\n⏳ Waiting for print job to be processed...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Clean up - delete the test order
    console.log('\n🧹 Cleaning up test order...');
    const Order = require('./models/Order');
    await Order.findByIdAndDelete(response.data.data._id);
    console.log('✅ Test order deleted');

    console.log('\n🎉 API order creation test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n📝 MongoDB connection closed');
  }
}

// Run the test
if (require.main === module) {
  testApiWithFixedJWT();
}

module.exports = testApiWithFixedJWT;
