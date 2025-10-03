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
  
  // Product types (many-to-many)
  productTypes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductType',
    required: true
  }],
  
  // Occasions (many-to-many)
  occasions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Occasion'
  }],
  
  // Product variants with tier-specific pricing, stock, and images
  variants: [{
    tierName: {
      type: String,
      enum: ['standard', 'deluxe', 'premium'],
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
      default: 0
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 999999
    },
    images: [{
      size: {
        type: String,
        required: true,
        enum: ['small', 'medium', 'large', 'xlarge']
      },
      publicId: {
        type: String,
        required: false
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
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Legacy fields for backwards compatibility (deprecated)
  // These will be populated from variants for existing data
  price: {
    standard: {
      type: Number,
      min: [0, 'Standard price cannot be negative'],
      default: 0
    },
    deluxe: {
      type: Number,
      min: [0, 'Deluxe price cannot be negative'],
      default: 0
    },
    premium: {
      type: Number,
      min: [0, 'Premium price cannot be negative'],
      default: 0
    }
  },
  
  // Legacy stock field removed - use variants.stock instead
  
  tags: [{
    type: String,
    trim: true
  }],
  
  // Legacy image fields for backwards compatibility (deprecated)
  images: [{
    size: {
      type: String,
      required: true,
      enum: ['small', 'medium', 'large', 'xlarge']
    },
    publicId: {
      type: String,
      required: false
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
  
  // Legacy tier-specific images (deprecated)
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
  
  isBestSeller: {
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

// Virtual for checking if product is in stock (any variant)
productSchema.virtual('inStock').get(function() {
  if (this.variants && this.variants.length > 0) {
    return this.variants.some(variant => variant.stock > 0 && variant.isActive);
  }
  return false;
});

// Virtual for checking if product is low in stock
productSchema.virtual('isLowStock').get(function() {
  if (this.variants && this.variants.length > 0) {
    return this.variants.some(variant => 
      variant.stock > 0 && variant.stock <= 5 && variant.isActive
    );
  }
  return false;
});

// Virtual for primary image (from variants or legacy)
productSchema.virtual('primaryImage').get(function() {
  // Try to find primary image from variants first
  if (this.variants && this.variants.length > 0) {
    for (const variant of this.variants) {
      if (variant.isActive && variant.images) {
        const primary = variant.images.find(img => img.isPrimary);
        if (primary) return primary;
        if (variant.images.length > 0) return variant.images[0];
      }
    }
  }
  
  // Fallback to legacy images
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

// Virtual for images by size (from variants or legacy)
productSchema.virtual('imagesBySize').get(function() {
  const imagesBySize = {};
  
  // Collect images from variants first
  if (this.variants && this.variants.length > 0) {
    this.variants.forEach(variant => {
      if (variant.isActive && variant.images) {
        variant.images.forEach(img => {
          if (!imagesBySize[img.size]) {
            imagesBySize[img.size] = [];
          }
          imagesBySize[img.size].push(img);
        });
      }
    });
  }
  
  // Fallback to legacy images if no variant images
  if (Object.keys(imagesBySize).length === 0) {
    this.images.forEach(img => {
      if (!imagesBySize[img.size]) {
        imagesBySize[img.size] = [];
      }
      imagesBySize[img.size].push(img);
    });
  }
  
  return imagesBySize;
});

// Virtual for getting image by specific size
productSchema.methods.getImageBySize = function(size) {
  // Try variants first
  if (this.variants && this.variants.length > 0) {
    for (const variant of this.variants) {
      if (variant.isActive && variant.images) {
        const image = variant.images.find(img => img.size === size);
        if (image) return image;
      }
    }
  }
  
  // Fallback to legacy images
  return this.images.find(img => img.size === size) || null;
};

// Virtual for formatted prices (from variants or legacy)
productSchema.virtual('formattedPrices').get(function() {
  if (this.variants && this.variants.length > 0) {
    const prices = {};
    this.variants.forEach(variant => {
      if (variant.isActive) {
        prices[variant.tierName] = (variant.price / 100).toFixed(2);
      }
    });
    return prices;
  }
  
  // Fallback to legacy prices
  return {
    standard: (this.price.standard / 100).toFixed(2),
    deluxe: (this.price.deluxe / 100).toFixed(2),
    premium: (this.price.premium / 100).toFixed(2)
  };
});

// Virtual for minimum price
productSchema.virtual('minPrice').get(function() {
  if (this.variants && this.variants.length > 0) {
    const activeVariants = this.variants.filter(v => v.isActive && v.stock > 0);
    if (activeVariants.length === 0) return 0;
    return Math.min(...activeVariants.map(v => v.price));
  }
  
  // Fallback to legacy prices
  return Math.min(this.price.standard, this.price.deluxe, this.price.premium);
});

// Virtual for maximum price
productSchema.virtual('maxPrice').get(function() {
  if (this.variants && this.variants.length > 0) {
    const activeVariants = this.variants.filter(v => v.isActive);
    if (activeVariants.length === 0) return 0;
    return Math.max(...activeVariants.map(v => v.price));
  }
  
  // Fallback to legacy prices
  return Math.max(this.price.standard, this.price.deluxe, this.price.premium);
});

// Method to get variant by tier name
productSchema.methods.getVariantByTier = function(tierName) {
  return this.variants.find(variant => 
    variant.tierName === tierName && variant.isActive
  );
};

// Method to get all active variants
productSchema.methods.getActiveVariants = function() {
  return this.variants.filter(variant => variant.isActive);
};

// Method to check if specific tier is in stock
productSchema.methods.isTierInStock = function(tierName) {
  const variant = this.getVariantByTier(tierName);
  return variant ? variant.stock > 0 : false;
};

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
productSchema.index({ productTypes: 1, isActive: 1 });
productSchema.index({ occasions: 1, isActive: 1 });
productSchema.index({ 'variants.tierName': 1, 'variants.isActive': 1 });
productSchema.index({ 'variants.stock': 1, 'variants.isActive': 1 });
// slug index is automatically created by unique: true
productSchema.index({ isFeatured: 1, sortOrder: 1 });
productSchema.index({ isBestSeller: 1, sortOrder: 1 });
productSchema.index({ 'price.standard': 1, 'price.deluxe': 1, 'price.premium': 1 });

// Text index for search
productSchema.index({ name: 'text', description: 'text' });


module.exports = mongoose.model('Product', productSchema);
