const axios = require('axios');

// Configuration
const BACKEND_URL = 'http://localhost:5001';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wovbwyaevtlfxwzcwhtr.supabase.co';

console.log('🔍 Testing Authentication Flow');
console.log('=============================\n');

// Test data
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  fullName: 'Test User'
};

async function testAuthFlow() {
  try {
    console.log('1️⃣ Testing Backend Health Check...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend is running:', healthResponse.data);
    
    console.log('\n2️⃣ Testing Root Endpoint...');
    const rootResponse = await axios.get(`${BACKEND_URL}/`);
    console.log('✅ Root endpoint:', rootResponse.data);
    
    console.log('\n3️⃣ Testing Public Shop Endpoints...');
    try {
      const shopsResponse = await axios.get(`${BACKEND_URL}/api/shops`);
      console.log('✅ Public shops endpoint accessible');
    } catch (error) {
      console.log('❌ Public shops endpoint error:', error.response?.data || error.message);
    }
    
    console.log('\n4️⃣ Testing Public Product Endpoints...');
    try {
      const productsResponse = await axios.get(`${BACKEND_URL}/api/products`);
      console.log('✅ Public products endpoint accessible');
    } catch (error) {
      console.log('❌ Public products endpoint error:', error.response?.data || error.message);
    }
    
    console.log('\n5️⃣ Testing Protected Endpoints Without Token...');
    try {
      await axios.get(`${BACKEND_URL}/api/auth/profile`);
      console.log('❌ Profile endpoint should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Profile endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    
    console.log('\n6️⃣ Testing User Creation in MongoDB...');
    console.log('📝 Note: This test requires a valid Supabase JWT token');
    console.log('   To get a token:');
    console.log('   1. Sign up at your frontend');
    console.log('   2. Check browser DevTools > Application > Local Storage');
    console.log('   3. Look for supabase.auth.token');
    console.log('   4. Copy the access_token value');
    console.log('   5. Use it in the next test');
    
    console.log('\n7️⃣ Testing with Valid Token (Manual Test)...');
    console.log('   To test with a real token:');
    console.log('   node test-with-supabase.js');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

async function testWithToken(token) {
  if (!token) {
    console.log('❌ No token provided. Please provide a valid Supabase JWT token.');
    return;
  }
  
  try {
    console.log('\n🔐 Testing with Valid Token...');
    
    // Test profile endpoint
    const profileResponse = await axios.get(`${BACKEND_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Profile endpoint with token:', profileResponse.data);
    
    // Test shop creation
    const shopData = {
      name: 'Test Flower Shop',
      description: 'A test shop for authentication testing',
      phone: '+1234567890',
      email: 'test@flowershop.com',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'US'
      },
      currency: 'USD',
      taxRate: 8.5
    };
    
    const shopResponse = await axios.post(`${BACKEND_URL}/api/shops`, shopData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Shop creation with token:', shopResponse.data);
    
  } catch (error) {
    console.error('❌ Token test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Main execution
if (require.main === module) {
  const token = process.argv[2];
  
  if (token) {
    testWithToken(token);
  } else {
    testAuthFlow();
  }
}

module.exports = { testAuthFlow, testWithToken };
