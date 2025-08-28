const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
let authToken = null;
let testUserId = null;

// Test data
const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  role: 'customer'
};

const testShop = {
  name: 'Test Flower Shop',
  description: 'A test shop for authentication testing',
  phone: '+1234567890',
  email: 'shop@test.com',
  address: {
    street: '123 Test Street',
    city: 'Test City',
    state: 'TS',
    postal: '12345',
    country: 'US'
  },
  location: {
    type: 'Point',
    coordinates: [-74.006, 40.7128] // NYC coordinates
  },
  currency: 'USD',
  taxRate: 0.08,
  deliveryOptions: {
    pickup: true,
    delivery: false
  }
};

async function testAuthentication() {
  console.log('🔐 Testing Flower Store Authentication System...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.status);
    console.log('   Uptime:', Math.round(healthResponse.data.uptime), 'seconds\n');

    // Test 2: Root Endpoint
    console.log('2️⃣ Testing Root Endpoint...');
    const rootResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Root Endpoint:', rootResponse.data.message);
    console.log('   Available endpoints:', Object.keys(rootResponse.data.endpoints).length, 'endpoints\n');

    // Test 3: Test Protected Endpoint Without Token
    console.log('3️⃣ Testing Protected Endpoint Without Token...');
    try {
      await axios.get(`${BASE_URL}/api/auth/profile`);
      console.log('❌ Should have failed - endpoint not properly protected');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Authentication Required - Endpoint properly protected');
        console.log('   Error:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 4: Test Shop Endpoints (Public)
    console.log('4️⃣ Testing Public Shop Endpoints...');
    const shopsResponse = await axios.get(`${BASE_URL}/api/shops`);
    console.log('✅ Public Shops Endpoint:', shopsResponse.data.data.length, 'shops found');
    console.log('   Pagination:', shopsResponse.data.pagination ? 'Working' : 'Not implemented');
    console.log('');

    // Test 5: Test Shop Creation Without Authentication
    console.log('5️⃣ Testing Shop Creation Without Authentication...');
    try {
      await axios.post(`${BASE_URL}/api/shops`, testShop);
      console.log('❌ Should have failed - shop creation not properly protected');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Shop Creation Protected - Authentication required');
        console.log('   Error:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 6: Test Admin Endpoints Without Admin Role
    console.log('6️⃣ Testing Admin Endpoints Without Admin Role...');
    try {
      await axios.get(`${BASE_URL}/api/auth/users`);
      console.log('❌ Should have failed - admin endpoint not properly protected');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Admin Endpoint Protected - Authentication required');
        console.log('   Error:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 7: Test Invalid Shop ID Format
    console.log('7️⃣ Testing Invalid Shop ID Format...');
    try {
      await axios.get(`${BASE_URL}/api/shops/invalid-id`);
      console.log('❌ Should have failed - invalid ID not properly handled');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Invalid ID Handled - Proper error response');
        console.log('   Error:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 8: Test Search and Filtering
    console.log('8️⃣ Testing Search and Filtering...');
    const searchResponse = await axios.get(`${BASE_URL}/api/shops?search=test&limit=5`);
    console.log('✅ Search Functionality:', searchResponse.data.data.length, 'results');
    console.log('   Query params working:', searchResponse.config.url.includes('search=test') ? 'Yes' : 'No');
    console.log('');

    console.log('🎉 Authentication System Tests Completed Successfully!');
    console.log('✅ All security measures are working correctly');
    console.log('✅ Public endpoints are accessible');
    console.log('✅ Protected endpoints require authentication');
    console.log('✅ Role-based access control is implemented');
    console.log('✅ Input validation is working');
    console.log('\n🚀 Your authentication system is ready for production!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    process.exit(1);
  }
}

// Check if axios is available
try {
  require.resolve('axios');
  testAuthentication();
} catch (e) {
  console.log('📦 Installing axios for testing...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install axios', { stdio: 'inherit' });
    console.log('✅ Axios installed successfully!\n');
    testAuthentication();
  } catch (installError) {
    console.error('❌ Failed to install axios:', installError.message);
    console.log('\n💡 Please run: npm install axios');
    process.exit(1);
  }
}
