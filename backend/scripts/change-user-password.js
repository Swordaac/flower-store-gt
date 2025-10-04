#!/usr/bin/env node

/**
 * Script to change user password
 * Usage: node change-user-password.js <email> <new_password>
 * Example: node change-user-password.js test11@mcgill.ca newpassword123
 */

const { supabaseService } = require('../config/supabase');
const mongoose = require('mongoose');
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

async function changeUserPassword(email, newPassword) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // First, find the user in Supabase
    const { data: supabaseUsers, error: supabaseError } = await supabaseService.auth.admin.listUsers();
    
    if (supabaseError) {
      throw new Error(`Supabase error: ${supabaseError.message}`);
    }
    
    const supabaseUser = supabaseUsers.users.find(user => user.email === email);
    
    if (!supabaseUser) {
      throw new Error(`User with email ${email} not found in Supabase`);
    }
    
    console.log(`✅ Found user in Supabase: ${supabaseUser.email} (ID: ${supabaseUser.id})`);
    
    // Update the password in Supabase
    const { data: updateData, error: updateError } = await supabaseService.auth.admin.updateUserById(
      supabaseUser.id,
      {
        password: newPassword
      }
    );
    
    if (updateError) {
      throw new Error(`Failed to update password in Supabase: ${updateError.message}`);
    }
    
    console.log(`✅ Password updated successfully in Supabase for user: ${email}`);
    
    // Also check if user exists in MongoDB and update last login
    const User = require('../models/User');
    const mongoUser = await User.findOne({ email: email });
    
    if (mongoUser) {
      console.log(`✅ Found user in MongoDB: ${mongoUser.name} (Role: ${mongoUser.role})`);
      
      // Update last login time to indicate password change
      await User.findByIdAndUpdate(mongoUser._id, {
        lastLoginAt: new Date()
      });
      
      console.log(`✅ Updated last login time in MongoDB`);
    } else {
      console.log(`⚠️  User not found in MongoDB database (this is normal if user hasn't logged in yet)`);
    }
    
    console.log(`\n🎉 Password change completed successfully!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 New password: ${newPassword}`);
    console.log(`⏰ Updated at: ${new Date().toISOString()}`);
    
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

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('❌ Usage: node change-user-password.js <email> <new_password>');
    console.log('📝 Example: node change-user-password.js test11@mcgill.ca newpassword123');
    process.exit(1);
  }
  
  const email = args[0];
  const newPassword = args[1];
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ Invalid email format');
    process.exit(1);
  }
  
  // Validate password strength
  if (newPassword.length < 6) {
    console.error('❌ Password must be at least 6 characters long');
    process.exit(1);
  }
  
  console.log('🚀 Starting password change process...');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 New password: ${'*'.repeat(newPassword.length)}`);
  console.log('─'.repeat(50));
  
  const result = await changeUserPassword(email, newPassword);
  
  if (result.success) {
    console.log('\n✅ Password change completed successfully!');
    console.log('🔐 The user can now log in with the new password.');
  } else {
    console.log('\n❌ Password change failed!');
    console.log(`Error: ${result.error}`);
    process.exit(1);
  }
  
  // Close MongoDB connection
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed');
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

module.exports = { changeUserPassword };
