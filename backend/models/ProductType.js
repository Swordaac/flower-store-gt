const mongoose = require('mongoose');

const productTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product type name is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Product type name cannot exceed 50 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  
  slug: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  sortOrder: {
    type: Number,
    default: 0
  },
  
  // Icon or image for the product type
  icon: {
    type: String,
    trim: true
  },
  
  // Color theme for UI
  color: {
    type: String,
    trim: true,
    default: '#6B7280'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to update slug if not provided
productTypeSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

// Indexes
productTypeSchema.index({ isActive: 1, sortOrder: 1 });
// slug index is automatically created by unique: true

module.exports = mongoose.model('ProductType', productTypeSchema);
