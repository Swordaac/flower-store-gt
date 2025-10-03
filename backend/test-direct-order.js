const mongoose = require('mongoose');
const Order = require('./models/Order');
const Shop = require('./models/Shop');
const User = require('./models/User');
const Product = require('./models/Product');
const printService = require('./services/printService');
require('dotenv').config();

async function testDirectOrderCreation() {
  console.log('🧪 Testing Direct Order Creation with Auto-Printing...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get test data
    const user = await User.findOne({ email: 'buyer@mail.mcgill.ca' });
    const shop = await Shop.findById('68c34f45ee89e0fd81c8aa4d');
    const product = await Product.findById('68c34f62ee89e0fd81c8aaa3');

    if (!user || !shop || !product) {
      console.log('❌ Missing required data:', { user: !!user, shop: !!shop, product: !!product });
      return;
    }

    console.log('✅ Found user:', user.email);
    console.log('✅ Found shop:', shop.name);
    console.log('✅ Found product:', product.name);

    // Create order directly (bypassing API authentication)
    const orderData = {
      customerId: user._id,
      shopId: shop._id,
      orderNumber: `DIRECT-TEST-${Date.now()}`,
      recipient: {
        name: 'Test Recipient',
        phone: '+1234567890',
        email: 'test@example.com'
      },
      items: [
        {
          productId: product._id,
          name: product.name,
          price: product.price?.standard || 5000,
          quantity: 1,
          total: product.price?.standard || 5000
        }
      ],
      subtotal: product.price?.standard || 5000,
      taxAmount: Math.round((product.price?.standard || 5000) * 0.15), // 15% tax
      deliveryFee: 500,
      total: (product.price?.standard || 5000) + Math.round((product.price?.standard || 5000) * 0.15) + 500,
      delivery: {
        method: 'delivery',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          province: 'QC',
          postalCode: 'H1A 1A1',
          country: 'Canada'
        },
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        time: '14:00',
        specialInstructions: 'Please ring doorbell twice',
        contactPhone: '+1234567890',
        contactEmail: 'test@example.com'
      },
      notes: 'Test order for auto-printing via direct creation',
      payment: {
        intentId: `pi_direct_test_${Date.now()}`,
        method: 'card',
        status: 'pending'
      }
    };

    console.log('\n📝 Creating order directly...');
    const order = new Order(orderData);
    const savedOrder = await order.save();
    console.log('✅ Order created:', savedOrder.orderNumber);

    // Test the print service directly
    console.log('\n🖨️ Testing print service...');
    const printResult = await printService.printOrderDetails(savedOrder);
    
    if (printResult.success) {
      console.log('✅ Print job submitted successfully');
      console.log('   Print Job ID:', printResult.printJobId);
      console.log('   Printer ID:', printResult.printerId);
    } else {
      console.log('❌ Print job failed:', printResult.error);
    }

    // Clean up - delete the test order
    console.log('\n🧹 Cleaning up test order...');
    await Order.findByIdAndDelete(savedOrder._id);
    console.log('✅ Test order deleted');

    console.log('\n🎉 Direct order creation test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n📝 MongoDB connection closed');
  }
}

// Run the test
if (require.main === module) {
  testDirectOrderCreation();
}

module.exports = testDirectOrderCreation;
