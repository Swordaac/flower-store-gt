const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  // Shop identification
  name: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true,
    maxlength: [100, 'Shop name cannot exceed 100 characters']
  },
  
  // Owner reference (Supabase user ID)
  ownerId: {
    type: String,
    required: [true, 'Shop owner is required'],
    index: true
  },
  
  // Business information
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Contact information
  phone: {
    type: String,
    trim: true
  },
  
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  
  // Address information
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    postal: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true
    },
    country: {
      type: String,
      default: 'US',
      trim: true
    }
  },
  
  // Geographic coordinates
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Coordinates are required']
    }
  },
  
  // Business settings
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  },
  
  taxRate: {
    type: Number,
    default: 0,
    min: [0, 'Tax rate cannot be negative'],
    max: [1, 'Tax rate cannot exceed 100%']
  },
  
  // Delivery options
  deliveryOptions: {
    pickup: {
      type: Boolean,
      default: true
    },
    delivery: {
      type: Boolean,
      default: false
    },
    deliveryRadius: {
      type: Number,
      default: 0, // in kilometers
      min: [0, 'Delivery radius cannot be negative']
    },
    deliveryFee: {
      type: Number,
      default: 0, // in cents
      min: [0, 'Delivery fee cannot be negative']
    }
  },
  
  // Stripe integration
  stripeAccountId: {
    type: String,
    default: null
  },
  
  // Shop status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Business hours (optional)
  businessHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted address
shopSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.postal}`;
});

// Virtual for checking if delivery is available
shopSchema.virtual('hasDelivery').get(function() {
  return this.deliveryOptions.delivery && this.deliveryOptions.deliveryRadius > 0;
});

// Indexes for performance and geospatial queries
shopSchema.index({ location: '2dsphere' });
shopSchema.index({ ownerId: 1 });
shopSchema.index({ isActive: 1 });
shopSchema.index({ 'address.city': 1, 'address.state': 1 });

module.exports = mongoose.model('Shop', shopSchema);
