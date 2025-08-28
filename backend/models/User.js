const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Supabase authentication integration
  supabaseUserId: {
    type: String,
    required: [true, 'Supabase user ID is required'],
    unique: true,
    index: true
  },
  
  // User profile information
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  // Role-based access control
  role: {
    type: String,
    enum: ['customer', 'shop_owner', 'admin'],
    default: 'customer'
  },
  
  // Profile metadata
  avatar: {
    type: String,
    default: null
  },
  
  phone: {
    type: String,
    trim: true
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
  lastLoginAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if user is shop owner
userSchema.virtual('isShopOwner').get(function() {
  return this.role === 'shop_owner' || this.role === 'admin';
});

// Virtual for checking if user is admin
userSchema.virtual('isAdmin').get(function() {
  return this.role === 'admin';
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);
