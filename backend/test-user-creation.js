const axios = require('axios');

console.log('🧪 Testing User Creation Flow');
console.log('=============================\n');

const BACKEND_URL = 'http://localhost:5001';

async function testUserCreation() {
  try {
    console.log('1️⃣ Testing Backend Health...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend is running:', healthResponse.data);
    
    console.log('\n2️⃣ Testing New Create-User Endpoint...');
    console.log('📝 This endpoint should be called automatically after Supabase signup');
    console.log('   Endpoint: POST /api/auth/create-user');
    console.log('   Requires: Valid Supabase JWT token');
    
    console.log('\n3️⃣ Testing Without Token (Should Fail)...');
    try {
      await axios.post(`${BACKEND_URL}/api/auth/create-user`, {
        email: 'test@example.com',
        fullName: 'Test User'
      });
      console.log('❌ Should have failed without token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    
    console.log('\n4️⃣ Testing with Invalid Token (Should Fail)...');
    try {
      await axios.post(`${BACKEND_URL}/api/auth/create-user`, {
        email: 'test@example.com',
        fullName: 'Test User'
      }, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      console.log('❌ Should have failed with invalid token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejects invalid token');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    
    console.log('\n5️⃣ Manual Testing Instructions...');
    console.log('   To test the complete flow:');
    console.log('   1. Start your frontend: npm run dev');
    console.log('   2. Start your backend: cd backend && npm run dev');
    console.log('   3. Go to http://localhost:3000/auth/signup');
    console.log('   4. Create a new account');
    console.log('   5. Check backend console for user creation logs');
    console.log('   6. Check MongoDB for new user record');
    console.log('   7. Try signing in with the new account');
    
    console.log('\n6️⃣ Expected Flow:');
    console.log('   Signup → Supabase creates user → Frontend calls /api/auth/create-user');
    console.log('   → Backend verifies token → Creates MongoDB user → Success');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testUserCreation();
