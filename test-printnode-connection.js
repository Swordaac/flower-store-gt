#!/usr/bin/env node

// Test PrintNode connection and configuration
require('dotenv').config();

console.log('🧪 Testing PrintNode Connection...\n');

// Check environment variables
console.log('1. Environment Variables:');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('   RENDER:', process.env.RENDER || 'undefined');
console.log('   PRINTNODE_API_KEY:', process.env.PRINTNODE_API_KEY ? `${process.env.PRINTNODE_API_KEY.substring(0, 8)}...` : 'undefined');

// Test print service configuration
console.log('\n2. Print Service Configuration:');
try {
  const printService = process.env.NODE_ENV === 'production' || process.env.RENDER 
    ? require('./backend/services/printServiceCloud')
    : require('./backend/services/printService');
  
  console.log('   ✅ Print service loaded successfully');
  console.log('   Service type:', process.env.NODE_ENV === 'production' || process.env.RENDER ? 'Cloud' : 'Local');
  
  // Test connection
  console.log('\n3. Testing PrintNode Connection:');
  printService.testConnection()
    .then(result => {
      console.log('   Connection result:', result);
      
      if (result.success) {
        console.log('   ✅ PrintNode connection successful');
        console.log('   Account:', result.account?.email || 'Unknown');
      } else {
        console.log('   ❌ PrintNode connection failed');
        console.log('   Error:', result.error);
      }
      
      // Test getting printers
      console.log('\n4. Testing Printer Detection:');
      return printService.getPrinters();
    })
    .then(printers => {
      console.log('   Printers found:', printers.length);
      if (printers.length > 0) {
        console.log('   ✅ Printers detected:');
        printers.forEach((printer, index) => {
          console.log(`     ${index + 1}. ${printer.name} (ID: ${printer.id})`);
        });
      } else {
        console.log('   ⚠️  No printers found');
        console.log('   Make sure PrintNode Client is running on a local machine');
      }
    })
    .catch(error => {
      console.error('   ❌ Error testing PrintNode:', error.message);
    });
    
} catch (error) {
  console.error('❌ Failed to load print service:', error.message);
}

console.log('\n📋 Troubleshooting Checklist:');
console.log('   • Is PRINTNODE_API_KEY set in environment variables?');
console.log('   • Is PrintNode Client installed and running on local machine?');
console.log('   • Is the local machine connected to the internet?');
console.log('   • Are there any printers connected to the local machine?');
console.log('   • Is the PrintNode Client logged in with the correct account?');
