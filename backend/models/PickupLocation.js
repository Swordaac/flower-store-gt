const mongoose = require('mongoose');

const pickupLocationSchema = new mongoose.Schema({
  // Location identification
  name: {
    type: String,
    required: [true, 'Location name is required'],
    trim: true,
    maxlength: [100, 'Location name cannot exceed 100 characters']
  },
  
  // Shop reference
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Shop ID is required'],
    index: true
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
    province: {
      type: String,
      required: [true, 'Province is required'],
      trim: true
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true
    },
    country: {
      type: String,
      default: 'Canada',
      trim: true
    }
  },
  
  // Geographic coordinates for mapping
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
  
  // Business hours for this location
  businessHours: {
    monday: { 
      open: { type: String, default: '09:00' },
      close: { type: String, default: '18:00' },
      isOpen: { type: Boolean, default: true }
    },
    tuesday: { 
      open: { type: String, default: '09:00' },
      close: { type: String, default: '18:00' },
      isOpen: { type: Boolean, default: true }
    },
    wednesday: { 
      open: { type: String, default: '09:00' },
      close: { type: String, default: '18:00' },
      isOpen: { type: Boolean, default: true }
    },
    thursday: { 
      open: { type: String, default: '09:00' },
      close: { type: String, default: '18:00' },
      isOpen: { type: Boolean, default: true }
    },
    friday: { 
      open: { type: String, default: '09:00' },
      close: { type: String, default: '18:00' },
      isOpen: { type: Boolean, default: true }
    },
    saturday: { 
      open: { type: String, default: '09:00' },
      close: { type: String, default: '17:00' },
      isOpen: { type: Boolean, default: true }
    },
    sunday: { 
      open: { type: String, default: '10:00' },
      close: { type: String, default: '16:00' },
      isOpen: { type: Boolean, default: false }
    }
  },
  
  // Pickup settings
  settings: {
    // Minimum notice required for pickup (in hours)
    minNoticeHours: {
      type: Number,
      default: 2,
      min: [0, 'Minimum notice cannot be negative']
    },
    // Maximum days in advance for pickup
    maxAdvanceDays: {
      type: Number,
      default: 30,
      min: [1, 'Maximum advance days must be at least 1']
    },
    // Time slots available (in minutes)
    timeSlotInterval: {
      type: Number,
      default: 30,
      min: [15, 'Time slot interval must be at least 15 minutes']
    },
    // Whether this location is currently accepting pickups
    isActive: {
      type: Boolean,
      default: true
    }
  },
  
  // Additional information
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Special instructions for customers
  pickupInstructions: {
    type: String,
    trim: true,
    maxlength: [1000, 'Pickup instructions cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted address
pickupLocationSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.province} ${addr.postalCode}`;
});

// Virtual for checking if location is open now
pickupLocationSchema.virtual('isOpenNow').get(function() {
  const now = new Date();
  const day = now.toLocaleLowerCase().slice(0, 3); // 'mon', 'tue', etc.
  const time = now.toTimeString().slice(0, 5); // 'HH:MM'
  
  const dayHours = this.businessHours[day];
  if (!dayHours || !dayHours.isOpen) return false;
  
  return time >= dayHours.open && time <= dayHours.close;
});

// Virtual for next available pickup time
pickupLocationSchema.virtual('nextAvailableTime').get(function() {
  const now = new Date();
  const minNotice = this.settings.minNoticeHours;
  const nextAvailable = new Date(now.getTime() + (minNotice * 60 * 60 * 1000));
  
  return nextAvailable;
});

// Method to get available time slots for a given date
pickupLocationSchema.methods.getAvailableTimeSlots = function(date) {
  const targetDate = new Date(date);
  const day = targetDate.toLocaleLowerCase().slice(0, 3);
  const dayHours = this.businessHours[day];
  
  if (!dayHours || !dayHours.isOpen) return [];
  
  const slots = [];
  const interval = this.settings.timeSlotInterval;
  const [openHour, openMin] = dayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = dayHours.close.split(':').map(Number);
  
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;
  
  for (let minutes = openMinutes; minutes < closeMinutes; minutes += interval) {
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    slots.push(timeString);
  }
  
  return slots;
};

// Indexes for performance and geospatial queries
pickupLocationSchema.index({ location: '2dsphere' });
pickupLocationSchema.index({ shopId: 1, 'settings.isActive': 1 });
pickupLocationSchema.index({ 'address.city': 1, 'address.province': 1 });

module.exports = mongoose.model('PickupLocation', pickupLocationSchema);
