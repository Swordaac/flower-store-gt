const printService = require('./services/printService');
const mongoose = require('mongoose');
require('dotenv').config();

// Test PrintNode integration
async function testPrintNodeIntegration() {
  console.log('🧪 Testing PrintNode Integration...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Connection Test
    console.log('\n1. Testing PrintNode Connection...');
    const connectionTest = await printService.testConnection();
    if (connectionTest.success) {
      console.log('✅ PrintNode connection successful');
      console.log('   Account:', connectionTest.account);
    } else {
      console.log('❌ PrintNode connection failed:', connectionTest.error);
      return;
    }

    // Test 2: Get Printers
    console.log('\n2. Getting Available Printers...');
    const printers = await printService.getPrinters();
    if (printers && printers.length > 0) {
      console.log(`✅ Found ${printers.length} printer(s):`);
      printers.forEach((printer, index) => {
        console.log(`   ${index + 1}. ${printer.name} (ID: ${printer.id})`);
      });
    } else {
      console.log('❌ No printers found. Please ensure PrintNode Client is running and printer is connected.');
      return;
    }

    // Test 3: Create Test Order
    console.log('\n3. Creating Test Order...');
    const testOrder = {
      _id: new mongoose.Types.ObjectId(),
      orderNumber: 'TEST-' + Date.now(),
      recipient: {
        name: 'Test Recipient',
        phone: '+1234567890',
        email: 'test@example.com'
      },
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
      items: [
        {
          name: 'Test Flower Bouquet',
          quantity: 1,
          price: 5000, // $50.00 in cents
          total: 5000
        }
      ],
      subtotal: 5000,
      taxAmount: 750,
      deliveryFee: 500,
      total: 6250,
      createdAt: new Date()
    };

    console.log('✅ Test order created:', testOrder.orderNumber);

    // Test 4: Generate PDF
    console.log('\n4. Testing PDF Generation...');
    try {
      const pdfBuffer = await printService.generateOrderPDF(testOrder);
      console.log(`✅ PDF generated successfully (${pdfBuffer.length} bytes)`);
    } catch (error) {
      console.log('❌ PDF generation failed:', error.message);
      return;
    }

    // Test 5: Print Order (Optional - only if you want to actually print)
    console.log('\n5. Testing Print Job Submission...');
    const printResult = await printService.printOrderDetails(testOrder);
    
    if (printResult.success) {
      console.log('✅ Print job submitted successfully');
      console.log('   Print Job ID:', printResult.printJobId);
      console.log('   Printer ID:', printResult.printerId);
    } else {
      console.log('❌ Print job failed:', printResult.error);
    }

    // Test 6: Get Print Job Statistics
    console.log('\n6. Getting Print Job Statistics...');
    const stats = printService.getPrintJobStats(7);
    console.log('✅ Print job statistics:', stats);

    console.log('\n🎉 PrintNode integration test completed successfully!');

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
  testPrintNodeIntegration();
}

module.exports = testPrintNodeIntegration;
