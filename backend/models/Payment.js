const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Stripe payment information
  stripePaymentIntentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  stripeSessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Order reference
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  
  // Customer information
  customerId: {
    type: String, // Supabase user ID
    required: true,
    index: true
  },
  
  // Payment details
  amount: {
    type: Number, // in cents
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  
  currency: {
    type: String,
    required: true,
    default: 'cad',
    enum: ['cad', 'usd', 'eur']
  },
  
  // Payment status
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'cancelled', 'requires_action'],
    default: 'pending'
  },
  
  // Payment method details
  paymentMethod: {
    type: {
      type: String,
      enum: ['card', 'bank_transfer', 'cash'],
      default: 'card'
    },
    last4: String, // Last 4 digits of card
    brand: String, // Card brand (visa, mastercard, etc.)
    expMonth: Number,
    expYear: Number
  },
  
  // Stripe customer information
  stripeCustomerId: {
    type: String,
    index: true
  },
  
  // Timestamps
  paidAt: {
    type: Date,
    default: null
  },
  
  failedAt: {
    type: Date,
    default: null
  },
  
  // Error information
  failureReason: {
    type: String,
    maxlength: [500, 'Failure reason cannot exceed 500 characters']
  },
  
  // Refund information
  refunded: {
    type: Boolean,
    default: false
  },
  
  refundAmount: {
    type: Number, // in cents
    default: 0,
    min: [0, 'Refund amount cannot be negative']
  },
  
  refundedAt: {
    type: Date,
    default: null
  },
  
  // Metadata
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return (this.amount / 100).toFixed(2);
});

// Virtual for formatted refund amount
paymentSchema.virtual('formattedRefundAmount').get(function() {
  return (this.refundAmount / 100).toFixed(2);
});

// Virtual for checking if payment is successful
paymentSchema.virtual('isSuccessful').get(function() {
  return this.status === 'succeeded';
});

// Virtual for checking if payment is pending
paymentSchema.virtual('isPending').get(function() {
  return ['pending', 'processing', 'requires_action'].includes(this.status);
});

// Virtual for checking if payment failed
paymentSchema.virtual('isFailed').get(function() {
  return this.status === 'failed';
});

// Indexes for performance
paymentSchema.index({ customerId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ stripeCustomerId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
