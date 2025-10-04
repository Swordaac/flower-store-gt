#!/usr/bin/env node

/**
 * Quick script to change password for test11@mcgill.ca
 * Usage: node change-test11-password.js [new_password]
 * If no password provided, will generate a secure random password
 */

const { changeUserPassword, generateSecurePassword } = require('./user-password-manager');

async function main() {
  const email = 'test11@mcgill.ca';
  const args = process.argv.slice(2);
  
  let newPassword;
  
  if (args.length > 0) {
    newPassword = args[0];
    
    // Validate password
    if (newPassword.length < 6) {
      console.error('❌ Password must be at least 6 characters long');
      process.exit(1);
    }
  } else {
    // Generate a secure password
    newPassword = generateSecurePassword(12);
    console.log('🔐 Generated secure password (12 characters)');
  }
  
  console.log('🚀 Changing password for test11@mcgill.ca');
  console.log('─'.repeat(50));
  
  const result = await changeUserPassword(email, newPassword);
  
  if (result.success) {
    console.log('\n🎉 SUCCESS! Password changed successfully!');
    console.log('─'.repeat(50));
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 New Password: ${newPassword}`);
    console.log(`⏰ Updated: ${result.updatedAt.toLocaleString()}`);
    console.log('─'.repeat(50));
    console.log('✅ The user can now log in with the new password.');
  } else {
    console.log('\n❌ FAILED! Password change unsuccessful!');
    console.log('─'.repeat(50));
    console.log(`Error: ${result.error}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}
