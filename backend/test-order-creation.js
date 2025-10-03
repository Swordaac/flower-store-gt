const mongoose = require('mongoose');
const Order = require('./models/Order');
const Shop = require('./models/Shop');
const User = require('./models/User');
const printService = require('./services/printService');
require('dotenv').config();

async function testOrderCreation() {
  console.log('🧪 Testing Order Creation with Auto-Printing...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get a test shop and user
    const shop = await Shop.findOne({ isActive: true });
    const user = await User.findOne({ role: 'customer' });

    if (!shop) {
      console.log('❌ No active shop found. Please create a shop first.');
      return;
    }

    if (!user) {
      console.log('❌ No customer user found. Please create a customer user first.');
      return;
    }

    console.log('✅ Found shop:', shop.name);
    console.log('✅ Found user:', user.email);

    // Create a test order with recipient information
    const testOrder = new Order({
      customerId: user._id,
      shopId: shop._id,
      orderNumber: `TEST-ORDER-${Date.now()}`,
      recipient: {
        name: 'Test Recipient',
        phone: '+1234567890',
        email: 'test@example.com'
      },
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: 'Test Flower Bouquet',
          price: 5000, // $50.00 in cents
          quantity: 1,
          total: 5000
        }
      ],
      subtotal: 5000,
      taxAmount: 750,
      deliveryFee: 500,
      total: 6250,
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
      notes: 'Test order for auto-printing',
      payment: {
        intentId: `pi_test_${Date.now()}`,
        method: 'card',
        status: 'pending'
      }
    });

    console.log('\n📝 Creating test order...');
    const savedOrder = await testOrder.save();
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

    console.log('\n🎉 Order creation test completed!');

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
  testOrderCreation();
}

module.exports = testOrderCreation;
