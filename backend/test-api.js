const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test data
const testProduct = {
  name: 'Test Rose Bouquet',
  price: 24.99,
  quantity: 15,
  description: 'Beautiful red roses for testing',
  category: 'bouquet'
};

async function testAPI() {
  console.log('🧪 Testing Flower Store API...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.status);
    console.log('   Uptime:', Math.round(healthResponse.data.uptime), 'seconds\n');

    // Test 2: Create Product
    console.log('2️⃣ Testing Product Creation...');
    const createResponse = await axios.post(`${BASE_URL}/api/products`, testProduct);
    const createdProduct = createResponse.data.data;
    console.log('✅ Product Created:', createdProduct.name);
    console.log('   ID:', createdProduct._id);
    console.log('   Price: $' + createdProduct.price);
    console.log('   Stock:', createdProduct.quantity, '\n');

    // Test 3: Get All Products
    console.log('3️⃣ Testing Get All Products...');
    const getAllResponse = await axios.get(`${BASE_URL}/api/products`);
    console.log('✅ Products Retrieved:', getAllResponse.data.count, 'products\n');

    // Test 4: Get Single Product
    console.log('4️⃣ Testing Get Single Product...');
    const getOneResponse = await axios.get(`${BASE_URL}/api/products/${createdProduct._id}`);
    console.log('✅ Product Retrieved:', getOneResponse.data.data.name);
    console.log('   Description:', getOneResponse.data.data.description, '\n');

    // Test 5: Update Product
    console.log('5️⃣ Testing Product Update...');
    const updateData = { ...testProduct, price: 29.99, quantity: 20 };
    const updateResponse = await axios.put(`${BASE_URL}/api/products/${createdProduct._id}`, updateData);
    console.log('✅ Product Updated');
    console.log('   New Price: $' + updateResponse.data.data.price);
    console.log('   New Stock:', updateResponse.data.data.quantity, '\n');

    // Test 6: Update Stock Only
    console.log('6️⃣ Testing Stock Update...');
    const stockResponse = await axios.patch(`${BASE_URL}/api/products/${createdProduct._id}/stock`, { quantity: 25 });
    console.log('✅ Stock Updated:', stockResponse.data.data.quantity, 'units\n');

    // Test 7: Filter Products
    console.log('7️⃣ Testing Product Filtering...');
    const filterResponse = await axios.get(`${BASE_URL}/api/products?category=bouquet&minPrice=20`);
    console.log('✅ Filtered Products:', filterResponse.data.count, 'bouquets above $20\n');

    // Test 8: Delete Product
    console.log('8️⃣ Testing Product Deletion...');
    const deleteResponse = await axios.delete(`${BASE_URL}/api/products/${createdProduct._id}`);
    console.log('✅ Product Deleted:', deleteResponse.data.data.name, '\n');

    // Test 9: Verify Deletion
    console.log('9️⃣ Verifying Deletion...');
    try {
      await axios.get(`${BASE_URL}/api/products/${createdProduct._id}`);
      console.log('❌ Product still exists (this should not happen)');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Product successfully deleted (404 Not Found)\n');
      } else {
        console.log('❌ Unexpected error during verification:', error.message);
      }
    }

    console.log('🎉 All tests completed successfully!');
    console.log('🚀 Your Flower Store API is working perfectly!');

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
  testAPI();
} catch (e) {
  console.log('📦 Installing axios for testing...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install axios', { stdio: 'inherit' });
    console.log('✅ Axios installed successfully!\n');
    testAPI();
  } catch (installError) {
    console.error('❌ Failed to install axios:', installError.message);
    console.log('\n💡 Please run: npm install axios');
    process.exit(1);
  }
}
