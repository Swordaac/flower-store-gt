const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
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
  
  // Stripe subscription details
  stripeSubscriptionId: {
    type: String,
    required: [true, 'Stripe subscription ID is required'],
    unique: true,
    index: true
  },
  
  // Subscription plan information
  plan: {
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number, // in cents
      required: true,
      min: [0, 'Price cannot be negative']
    },
    interval: {
      type: String,
      enum: ['month', 'year', 'week'],
      required: true
    },
    intervalCount: {
      type: Number,
      default: 1,
      min: [1, 'Interval count must be at least 1']
    }
  },
  
  // Subscription status
  status: {
    type: String,
    enum: ['active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid'],
    default: 'active'
  },
  
  // Billing cycle information
  currentPeriodStart: {
    type: Date,
    required: true
  },
  
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  
  // Trial information
  trialStart: Date,
  trialEnd: Date,
  
  // Cancellation information
  canceledAt: Date,
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  
  // Payment information
  paymentMethod: {
    type: String,
    default: null
  },
  
  // Subscription metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Customer preferences
  preferences: {
    autoRenew: {
      type: Boolean,
      default: true
    },
    notifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for subscription status display
subscriptionSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    active: 'Active',
    canceled: 'Canceled',
    incomplete: 'Incomplete',
    incomplete_expired: 'Expired',
    past_due: 'Past Due',
    trialing: 'Trial',
    unpaid: 'Unpaid'
  };
  return statusMap[this.status] || this.status;
});

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function() {
  return ['active', 'trialing'].includes(this.status);
});

// Virtual for checking if subscription is in trial
subscriptionSchema.virtual('isTrial').get(function() {
  return this.status === 'trialing';
});

// Virtual for formatted price
subscriptionSchema.virtual('formattedPrice').get(function() {
  return (this.plan.price / 100).toFixed(2);
});

// Virtual for next billing date
subscriptionSchema.virtual('nextBillingDate').get(function() {
  return this.currentPeriodEnd;
});

// Virtual for days until renewal
subscriptionSchema.virtual('daysUntilRenewal').get(function() {
  if (!this.isActive) return null;
  const now = new Date();
  const renewal = new Date(this.currentPeriodEnd);
  const diffTime = renewal - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Pre-save middleware to update trial status
subscriptionSchema.pre('save', function(next) {
  if (this.trialEnd && new Date() > this.trialEnd && this.status === 'trialing') {
    this.status = 'active';
  }
  next();
});

// Indexes for performance
subscriptionSchema.index({ customerId: 1, status: 1 });
subscriptionSchema.index({ shopId: 1, status: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });
subscriptionSchema.index({ 'plan.interval': 1, 'plan.intervalCount': 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
