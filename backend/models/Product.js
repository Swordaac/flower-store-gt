const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Shop reference
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Shop ID is required'],
    index: true
  },
  
  // Product identification
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  
  // Product details
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Pricing (stored in cents for precision)
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  
  // Inventory
  quantity: {
    type: Number,
    required: [true, 'Product quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  
  // Category and tags
  category: {
    type: String,
    required: [true, 'Product category is required'],
    trim: true
  },
  
  tags: [{
    type: String,
    trim: true
  }],
  
  // Image management
  images: [{
    publicId: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Product status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Flexible metadata for custom fields
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // SEO and display
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if product is in stock
productSchema.virtual('inStock').get(function() {
  return this.quantity > 0;
});

// Virtual for checking if product is low in stock
productSchema.virtual('isLowStock').get(function() {
  return this.quantity > 0 && this.quantity <= 5;
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
  return (this.price / 100).toFixed(2);
});

// Pre-save middleware to update slug if not provided
productSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

// Indexes for performance and search
productSchema.index({ shopId: 1, isActive: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ slug: 1 });
productSchema.index({ isFeatured: 1, sortOrder: 1 });

module.exports = mongoose.model('Product', productSchema);
