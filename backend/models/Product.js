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
  
  // Product color
  color: {
    type: String,
    required: [true, 'Product color is required'],
    trim: true,
    maxlength: [50, 'Color cannot exceed 50 characters']
  },
  
  // Product details
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Tiered pricing (stored in cents for precision)
  price: {
    standard: {
      type: Number,
      required: [true, 'Standard price is required'],
      min: [0, 'Standard price cannot be negative'],
      default: 0
    },
    deluxe: {
      type: Number,
      required: [true, 'Deluxe price is required'],
      min: [0, 'Deluxe price cannot be negative'],
      default: 0
    },
    premium: {
      type: Number,
      required: [true, 'Premium price is required'],
      min: [0, 'Premium price cannot be negative'],
      default: 0
    }
  },
  
  // Inventory
  stock: {
    type: Number,
    required: [true, 'Product stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  
  // Category array
  category: {
    type: [String],
    required: [true, 'At least one category is required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one category is required'
    }
  },
  
  tags: [{
    type: String,
    trim: true
  }],
  
  // Image management - size-based images array
  images: [{
    size: {
      type: String,
      required: true,
      enum: ['small', 'medium', 'large', 'xlarge']
    },
    publicId: {
      type: String,
      required: false // Made optional for images that haven't been uploaded yet
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
  
  // Tier-specific images
  deluxeImage: {
    publicId: {
      type: String
    },
    url: {
      type: String
    },
    alt: {
      type: String,
      default: 'Deluxe version'
    }
  },
  
  premiumImage: {
    publicId: {
      type: String
    },
    url: {
      type: String
    },
    alt: {
      type: String,
      default: 'Premium version'
    }
  },
  
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
  return this.stock > 0;
});

// Virtual for checking if product is low in stock
productSchema.virtual('isLowStock').get(function() {
  return this.stock > 0 && this.stock <= 5;
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

// Virtual for images by size
productSchema.virtual('imagesBySize').get(function() {
  const imagesBySize = {};
  this.images.forEach(img => {
    if (!imagesBySize[img.size]) {
      imagesBySize[img.size] = [];
    }
    imagesBySize[img.size].push(img);
  });
  return imagesBySize;
});

// Virtual for getting image by specific size
productSchema.methods.getImageBySize = function(size) {
  return this.images.find(img => img.size === size) || null;
};

// Virtual for formatted prices
productSchema.virtual('formattedPrices').get(function() {
  return {
    standard: (this.price.standard / 100).toFixed(2),
    deluxe: (this.price.deluxe / 100).toFixed(2),
    premium: (this.price.premium / 100).toFixed(2)
  };
});

// Virtual for minimum price
productSchema.virtual('minPrice').get(function() {
  return Math.min(this.price.standard, this.price.deluxe, this.price.premium);
});

// Virtual for maximum price
productSchema.virtual('maxPrice').get(function() {
  return Math.max(this.price.standard, this.price.deluxe, this.price.premium);
});

// Pre-save middleware to update slug if not provided
productSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

// Post-save error handling for text index conflicts
productSchema.post('save', function(error, doc, next) {
  if (error && error.message && error.message.includes('Field \'category\' of text index contains an array')) {
    const customError = new Error('Database text index conflict. The existing text index includes the category field, but category is now an array. Please run the database fix script to resolve this.');
    customError.name = 'TextIndexConflict';
    return next(customError);
  }
  next(error);
});

// Indexes for performance and search
productSchema.index({ shopId: 1, isActive: 1 });
productSchema.index({ color: 1, isActive: 1 });
productSchema.index({ tags: 1 });
// slug index is automatically created by unique: true
productSchema.index({ isFeatured: 1, sortOrder: 1 });
productSchema.index({ 'price.standard': 1, 'price.deluxe': 1, 'price.premium': 1 });

// Text index temporarily disabled due to array field conflict
// TODO: Re-enable after fixing database indexes
// productSchema.index({ name: 'text', description: 'text' });

// Note: category index removed temporarily due to array field conflict with text search
// We'll add it back after fixing the text index issue

module.exports = mongoose.model('Product', productSchema);
