const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Customer and shop references
  customerId: {
    type: String, // Supabase user ID
    required: [true, 'Customer ID is required'],
    index: true
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
  
  // Delivery information
  delivery: {
    method: {
      type: String,
      enum: ['pickup', 'delivery'],
      required: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      postal: String,
      country: String
    },
    instructions: String,
    estimatedDelivery: Date
  },
  
  // Payment information
  payment: {
    intentId: {
      type: String, // Stripe payment intent ID
      required: true
    },
    method: {
      type: String,
      enum: ['card', 'cash', 'bank_transfer'],
      default: 'card'
    },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'cancelled'],
      default: 'pending'
    },
    paidAt: {
      type: Date,
      default: null
    }
  },
  
  // Customer notes
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
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
