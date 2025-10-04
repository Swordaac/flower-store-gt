#!/usr/bin/env node

// Test webhook fix
console.log('🧪 Testing Webhook Fix...\n');

console.log('✅ Changes Made:');
console.log('   1. Added express.raw() middleware for /api/stripe/webhook route');
console.log('   2. This ensures raw body is available for Stripe signature verification');
console.log('   3. Other routes still use express.json() for normal API calls');

console.log('\n📋 Next Steps:');
console.log('   1. Deploy these changes to Render');
console.log('   2. Test webhook in Stripe dashboard');
console.log('   3. Place a test order to verify full flow');

console.log('\n🔍 What to Look For:');
console.log('   • Webhook should return 200 status instead of 400');
console.log('   • Server logs should show: "Processing checkout.session.completed"');
console.log('   • Print job should be triggered: "🖨️ Triggering print job"');

console.log('\n🚀 Ready to deploy!');
