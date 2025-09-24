require('dotenv').config();
const axios = require('axios');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5001',
  testUserToken: process.env.TEST_USER_TOKEN, // Make sure to set this in your .env
  shopId: process.env.TEST_SHOP_ID, // Make sure to set this in your .env
};

// Test data - a cart with known prices
const testOrder = {
  shopId: TEST_CONFIG.shopId,
  items: [
    {
      productId: '65f5e2a0e68e6b9a7a6d1234', // Replace with a real product ID from your database
      name: 'Test Product',
      price: 2000, // $20.00 in cents
      quantity: 3,
      image: 'https://example.com/test-image.jpg',
      selectedTier: 'standard'
    }
  ],
  delivery: {
    method: 'delivery',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    time: '14:00',
    contactPhone: '514-555-0123',
    contactEmail: 'test@example.com',
    address: {
      street: '1234 Test Street',
      city: 'Montreal',
      province: 'QC',
      postalCode: 'H2X 2B2',
      country: 'Canada'
    }
  },
  recipient: {
    name: 'Test Recipient',
    phone: '514-555-0123',
    email: 'recipient@example.com'
  }
};

// Expected totals
const EXPECTED = {
  subtotal: 6000, // $60.00 (3 * $20.00)
  deliveryFee: 1000, // $10.00 (example delivery fee)
  taxRate: 0.14975, // 14.975% (QC tax rate)
  // Calculate expected tax and total
  get taxAmount() {
    return Math.round((this.subtotal + this.deliveryFee) * this.taxRate);
  },
  get total() {
    return this.subtotal + this.deliveryFee + this.taxAmount;
  }
};

async function runTest() {
  try {
    console.log('=== Starting Stripe Checkout Test ===');
    console.log('Test Order Data:', JSON.stringify(testOrder, null, 2));
    console.log('\nExpected Totals:');
    console.log('Subtotal:', EXPECTED.subtotal);
    console.log('Delivery Fee:', EXPECTED.deliveryFee);
    console.log('Tax Amount:', EXPECTED.taxAmount);
    console.log('Total:', EXPECTED.total);

    // Make the request to create checkout session
    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/api/stripe/create-checkout-session`,
      testOrder,
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.testUserToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n=== Test Results ===');
    if (response.data.success) {
      console.log('✅ Checkout session created successfully');
      console.log('Session ID:', response.data.sessionId);
      console.log('Checkout URL:', response.data.url);
      console.log('Order ID:', response.data.orderId);
    } else {
      console.log('❌ Failed to create checkout session');
      console.log('Error:', response.data.error);
    }

  } catch (error) {
    console.error('\n=== Test Failed ===');
    if (error.response) {
      console.error('Server Response:', error.response.data);
      console.error('Status Code:', error.response.status);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
runTest();


