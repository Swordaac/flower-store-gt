const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Customer and shop references
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required'],
    index: true
  },

  // Recipient information
  recipient: {
    name: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    phone: {
      type: String,
      required: [true, 'Recipient phone number is required'],
      trim: true,
      match: [/^[\d\s\-\+\(\)]{10,}$/, 'Please enter a valid phone number']
    },
    email: {
      type: String,
      required: [true, 'Recipient email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    }
  },

  // Optional occasion and card message
  occasion: {
    type: String,
    trim: true,
    maxlength: [50, 'Occasion cannot exceed 50 characters']
  },
  cardMessage: {
    type: String,
    trim: true,
    maxlength: [500, 'Card message cannot exceed 500 characters']
  },
  
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Shop ID is required'],
    index: true
  },
  
  // Order identification
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },

  
  // Order items with product snapshots
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    // Selected tier for variant-based products (standard, deluxe, premium)
    selectedTier: {
      type: String,
      enum: ['standard', 'deluxe', 'premium'],
      required: false
    },
    price: {
      type: Number, // in cents
      required: true,
      min: [0, 'Price cannot be negative']
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    total: {
      type: Number, // price * quantity in cents
      required: true
    }
  }],
  
  // Financial calculations (all in cents)
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  
  taxAmount: {
    type: Number,
    required: true,
    min: [0, 'Tax amount cannot be negative']
  },
  
  deliveryFee: {
    type: Number,
    default: 0,
    min: [0, 'Delivery fee cannot be negative']
  },

  // Optional service/platform/processing fee
  serviceFee: {
    type: Number,
    default: 0,
    min: [0, 'Service fee cannot be negative']
  },
  
  total: {
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative']
  },
  
  // Order status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
  // Delivery/Pickup information
  delivery: {
    method: {
      type: String,
      enum: {
        values: ['pickup', 'delivery'],
        message: '{VALUE} is not a valid delivery method'
      },
      required: [true, 'Delivery method is required']
    },
    // For delivery orders
    address: {
      company: {
        type: String,
        trim: true,
        maxlength: [100, 'Company name cannot exceed 100 characters']
      },
      street: {
        type: String,
        trim: true,
        required: [
          function() { return this.parent().method === 'delivery'; },
          'Street address is required for delivery'
        ],
        maxlength: [200, 'Street address cannot exceed 200 characters']
      },
      city: {
        type: String,
        trim: true,
        required: [
          function() { return this.parent().method === 'delivery'; },
          'City is required for delivery'
        ],
        maxlength: [100, 'City cannot exceed 100 characters']
      },
      province: {
        type: String,
        trim: true,
        required: [
          function() { return this.parent().method === 'delivery'; },
          'Province is required for delivery'
        ],
        enum: {
          values: ['QC', 'ON', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'YT', 'NT', 'NU'],
          message: '{VALUE} is not a valid province'
        }
      },
      postalCode: {
        type: String,
        trim: true,
        required: [
          function() { return this.parent().method === 'delivery'; },
          'Postal code is required for delivery'
        ],
        match: [/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, 'Please enter a valid Canadian postal code']
      },
      country: {
        type: String,
        default: 'Canada',
        enum: ['Canada']
      }
    },
    // Date and time
    date: {
      type: Date,
      required: [true, 'Date is required'],
      validate: {
        validator: function(value) {
          return value > new Date();
        },
        message: 'Date must be in the future'
      }
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in 24-hour format (HH:MM)']
    },
    // Delivery specific fields
    instructions: {
      type: String,
      trim: true,
      maxlength: [500, 'Delivery instructions cannot exceed 500 characters']
    },
    buzzerCode: {
      type: String,
      trim: true,
      maxlength: [20, 'Buzzer code cannot exceed 20 characters']
    },
    // Pickup specific fields
    pickupStoreAddress: {
      type: String,
      default: '1208 Crescent St, Montreal, Quebec H3G 2A9',
      required: [
        function() { return this.parent().method === 'pickup'; },
        'Pickup store address is required for pickup orders'
      ]
    },
    // Contact information
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
      match: [/^[\d\s\-\+\(\)]{10,}$/, 'Please enter a valid phone number']
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    // Special instructions
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: [500, 'Special instructions cannot exceed 500 characters']
    },
    // Estimated times (set by system)
    estimatedDelivery: Date,
    estimatedPickup: Date
  },
  
  // Payment information
  payment: {
    intentId: {
      type: String, // Stripe payment intent ID
      required: false // Made optional as it will be set after Stripe session creation
    },
    sessionId: {
      type: String, // Stripe checkout session ID
      required: false
    },
    method: {
      type: String,
      enum: ['card', 'cash', 'bank_transfer'],
      default: 'card'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'succeeded', 'failed', 'cancelled', 'requires_action'],
      default: 'pending'
    },
    paidAt: {
      type: Date,
      default: null
    },
    failureReason: {
      type: String,
      maxlength: [500, 'Failure reason cannot exceed 500 characters']
    }
  },
  
  // Inventory reservation state
  stockReserved: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Customer notes
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },

  // Print preferences
  printPreferences: {
    deliveryInstructionsTray: {
      type: String,
      default: 'default',
      trim: true
    },
    cardMessageTray: {
      type: String,
      default: 'default',
      trim: true
    },
    orderSummaryTray: {
      type: String,
      default: 'default',
      trim: true
    },
    customLayouts: {
      deliveryInstructions: {
        type: Object,
        default: null
      },
      cardMessage: {
        type: Object,
        default: null
      },
      orderSummary: {
        type: Object,
        default: null
      }
    },
    printAllDocuments: {
      type: Boolean,
      default: true
    },
    printDeliveryInstructions: {
      type: Boolean,
      default: true
    },
    printCardMessage: {
      type: Boolean,
      default: true
    },
    printOrderSummary: {
      type: Boolean,
      default: true
    }
  },
  
  // Timestamps for order lifecycle
  confirmedAt: Date,
  preparedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for order status display
orderSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready for Pickup',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  return statusMap[this.status] || this.status;
});

// Virtual for formatted totals
orderSchema.virtual('formattedSubtotal').get(function() {
  return (this.subtotal / 100).toFixed(2);
});

orderSchema.virtual('formattedTax').get(function() {
  return (this.taxAmount / 100).toFixed(2);
});

orderSchema.virtual('formattedTotal').get(function() {
  return (this.total / 100).toFixed(2);
});

// Virtual for checking if order is completed
orderSchema.virtual('isCompleted').get(function() {
  return ['delivered', 'cancelled'].includes(this.status);
});

// Pre-save middleware to generate order number
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

// Indexes for performance
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ shopId: 1, status: 1 });
// orderNumber index is automatically created by unique: true
orderSchema.index({ 'payment.intentId': 1 });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
