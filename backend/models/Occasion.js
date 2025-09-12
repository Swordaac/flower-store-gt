const mongoose = require('mongoose');

const occasionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Occasion name is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Occasion name cannot exceed 50 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  sortOrder: {
    type: Number,
    default: 0
  },
  
  // Icon or image for the occasion
  icon: {
    type: String,
    trim: true
  },
  
  // Color theme for UI
  color: {
    type: String,
    trim: true,
    default: '#6B7280'
  },
  
  // Whether this is a seasonal occasion
  isSeasonal: {
    type: Boolean,
    default: false
  },
  
  // Date range for seasonal occasions
  seasonalStart: {
    type: Date
  },
  
  seasonalEnd: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to update slug if not provided
occasionSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

// Virtual for checking if occasion is currently active (for seasonal occasions)
occasionSchema.virtual('isCurrentlyActive').get(function() {
  if (!this.isSeasonal || !this.seasonalStart || !this.seasonalEnd) {
    return this.isActive;
  }
  
  const now = new Date();
  return this.isActive && now >= this.seasonalStart && now <= this.seasonalEnd;
});

// Indexes
occasionSchema.index({ isActive: 1, sortOrder: 1 });
occasionSchema.index({ slug: 1 });
occasionSchema.index({ isSeasonal: 1, seasonalStart: 1, seasonalEnd: 1 });

module.exports = mongoose.model('Occasion', occasionSchema);
