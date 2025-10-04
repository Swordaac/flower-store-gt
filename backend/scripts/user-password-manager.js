#!/usr/bin/env node

/**
 * User Password Manager Script
 * 
 * This script provides various options for managing user passwords:
 * 1. Change password for a specific user
 * 2. Reset password and send reset email
 * 3. List users and their status
 * 4. Generate a random password
 * 
 * Usage:
 *   node user-password-manager.js change <email> <new_password>
 *   node user-password-manager.js reset <email>
 *   node user-password-manager.js list
 *   node user-password-manager.js generate-password
 */

const { supabaseService } = require('../config/supabase');
const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/flower-store')
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

/**
 * Generate a secure random password
 */
function generateSecurePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each category
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // special char
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Change user password
 */
async function changeUserPassword(email, newPassword) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Find user in Supabase
    const { data: supabaseUsers, error: supabaseError } = await supabaseService.auth.admin.listUsers();
    
    if (supabaseError) {
      throw new Error(`Supabase error: ${supabaseError.message}`);
    }
    
    const supabaseUser = supabaseUsers.users.find(user => user.email === email);
    
    if (!supabaseUser) {
      throw new Error(`User with email ${email} not found in Supabase`);
    }
    
    console.log(`✅ Found user in Supabase: ${supabaseUser.email} (ID: ${supabaseUser.id})`);
    console.log(`📅 Created: ${new Date(supabaseUser.created_at).toLocaleString()}`);
    console.log(`📅 Last sign in: ${supabaseUser.last_sign_in_at ? new Date(supabaseUser.last_sign_in_at).toLocaleString() : 'Never'}`);
    
    // Update password in Supabase
    const { data: updateData, error: updateError } = await supabaseService.auth.admin.updateUserById(
      supabaseUser.id,
      {
        password: newPassword
      }
    );
    
    if (updateError) {
      throw new Error(`Failed to update password in Supabase: ${updateError.message}`);
    }
    
    console.log(`✅ Password updated successfully in Supabase`);
    
    // Update MongoDB user if exists
    const User = require('../models/User');
    const mongoUser = await User.findOne({ email: email });
    
    if (mongoUser) {
      console.log(`✅ Found user in MongoDB: ${mongoUser.name} (Role: ${mongoUser.role})`);
      
      await User.findByIdAndUpdate(mongoUser._id, {
        lastLoginAt: new Date()
      });
      
      console.log(`✅ Updated last login time in MongoDB`);
    } else {
      console.log(`⚠️  User not found in MongoDB (normal if user hasn't logged in yet)`);
    }
    
    return {
      success: true,
      email: email,
      supabaseUserId: supabaseUser.id,
      mongoUserId: mongoUser?._id,
      updatedAt: new Date()
    };
    
  } catch (error) {
    console.error(`❌ Error changing password for ${email}:`, error.message);
    return {
      success: false,
      error: error.message,
      email: email
    };
  }
}

/**
 * Reset user password and send reset email
 */
async function resetUserPassword(email) {
  try {
    console.log(`📧 Sending password reset email to: ${email}`);
    
    const { data, error } = await supabaseService.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`
      }
    });
    
    if (error) {
      throw new Error(`Failed to generate reset link: ${error.message}`);
    }
    
    console.log(`✅ Password reset email sent successfully`);
    console.log(`🔗 Reset link: ${data.properties.action_link}`);
    
    return {
      success: true,
      email: email,
      resetLink: data.properties.action_link,
      sentAt: new Date()
    };
    
  } catch (error) {
    console.error(`❌ Error sending reset email to ${email}:`, error.message);
    return {
      success: false,
      error: error.message,
      email: email
    };
  }
}

/**
 * List all users
 */
async function listUsers() {
  try {
    console.log(`📋 Fetching all users...`);
    
    // Get Supabase users
    const { data: supabaseUsers, error: supabaseError } = await supabaseService.auth.admin.listUsers();
    
    if (supabaseError) {
      throw new Error(`Supabase error: ${supabaseError.message}`);
    }
    
    // Get MongoDB users
    const User = require('../models/User');
    const mongoUsers = await User.find({}).select('email name role isActive lastLoginAt createdAt');
    
    console.log(`\n📊 User Statistics:`);
    console.log(`   Supabase users: ${supabaseUsers.users.length}`);
    console.log(`   MongoDB users: ${mongoUsers.length}`);
    console.log(`   Active users: ${mongoUsers.filter(u => u.isActive).length}`);
    
    console.log(`\n👥 Supabase Users:`);
    console.log('─'.repeat(80));
    supabaseUsers.users.forEach((user, index) => {
      const mongoUser = mongoUsers.find(mu => mu.email === user.email);
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`   Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`);
      console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   MongoDB Role: ${mongoUser ? mongoUser.role : 'Not found'}`);
      console.log(`   MongoDB Active: ${mongoUser ? (mongoUser.isActive ? 'Yes' : 'No') : 'N/A'}`);
      console.log('─'.repeat(80));
    });
    
    return {
      success: true,
      supabaseUsers: supabaseUsers.users,
      mongoUsers: mongoUsers
    };
    
  } catch (error) {
    console.error(`❌ Error listing users:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log('❌ Usage: node user-password-manager.js <command> [options]');
    console.log('');
    console.log('📋 Available commands:');
    console.log('  change <email> <new_password>  - Change user password');
    console.log('  reset <email>                  - Send password reset email');
    console.log('  list                           - List all users');
    console.log('  generate-password              - Generate a secure password');
    console.log('');
    console.log('📝 Examples:');
    console.log('  node user-password-manager.js change test11@mcgill.ca newpassword123');
    console.log('  node user-password-manager.js reset test11@mcgill.ca');
    console.log('  node user-password-manager.js list');
    console.log('  node user-password-manager.js generate-password');
    process.exit(1);
  }
  
  console.log('🚀 User Password Manager');
  console.log('─'.repeat(50));
  
  switch (command) {
    case 'change':
      if (args.length < 3) {
        console.error('❌ Usage: node user-password-manager.js change <email> <new_password>');
        process.exit(1);
      }
      
      const email = args[1];
      const newPassword = args[2];
      
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.error('❌ Invalid email format');
        process.exit(1);
      }
      
      // Validate password
      if (newPassword.length < 6) {
        console.error('❌ Password must be at least 6 characters long');
        process.exit(1);
      }
      
      const changeResult = await changeUserPassword(email, newPassword);
      
      if (changeResult.success) {
        console.log('\n🎉 Password changed successfully!');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 New password: ${newPassword}`);
      } else {
        console.log('\n❌ Password change failed!');
        console.log(`Error: ${changeResult.error}`);
        process.exit(1);
      }
      break;
      
    case 'reset':
      if (args.length < 2) {
        console.error('❌ Usage: node user-password-manager.js reset <email>');
        process.exit(1);
      }
      
      const resetEmail = args[1];
      const resetResult = await resetUserPassword(resetEmail);
      
      if (resetResult.success) {
        console.log('\n🎉 Password reset email sent!');
        console.log(`📧 Email: ${resetEmail}`);
        console.log(`🔗 Reset link: ${resetResult.resetLink}`);
      } else {
        console.log('\n❌ Password reset failed!');
        console.log(`Error: ${resetResult.error}`);
        process.exit(1);
      }
      break;
      
    case 'list':
      const listResult = await listUsers();
      
      if (!listResult.success) {
        console.log('\n❌ Failed to list users!');
        console.log(`Error: ${listResult.error}`);
        process.exit(1);
      }
      break;
      
    case 'generate-password':
      const passwordLength = args[2] ? parseInt(args[2]) : 12;
      const generatedPassword = generateSecurePassword(passwordLength);
      
      console.log('\n🔐 Generated Secure Password:');
      console.log(`   Password: ${generatedPassword}`);
      console.log(`   Length: ${generatedPassword.length} characters`);
      console.log(`   Strength: Strong (contains lowercase, uppercase, numbers, and special characters)`);
      break;
      
    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('Run without arguments to see available commands.');
      process.exit(1);
  }
  
  // Close MongoDB connection
  await mongoose.connection.close();
  console.log('\n🔌 MongoDB connection closed');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { 
  changeUserPassword, 
  resetUserPassword, 
  listUsers, 
  generateSecurePassword 
};
