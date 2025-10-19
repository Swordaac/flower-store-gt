const mongoose = require('mongoose');

const checkoutPayloadSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },

  // Items prepared for pricing (flattened, safe for JSON)
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true },
      selectedTier: { type: String },
      price: { type: Number, required: true }, // cents
      quantity: { type: Number, required: true, min: 1 },
      total: { type: Number, required: true },
      image: { type: String }
    }
  ],

  // Totals (cents)
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  deliveryFee: { type: Number, required: true },
  total: { type: Number, required: true },

  // Recipient and delivery
  recipient: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true }
  },
  occasion: { type: String },
  cardMessage: { type: String },
  delivery: { type: Object, required: true },
  notes: { type: String },

  // For traceability
  createdAt: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

checkoutPayloadSchema.index({ shopId: 1, createdAt: -1 });
checkoutPayloadSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model('CheckoutPayload', checkoutPayloadSchema);


