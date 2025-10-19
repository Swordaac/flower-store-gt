const Stripe = require('stripe');

// Initialize Stripe with secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

console.log('Initializing Stripe with key:', process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe configuration
const APP_BASE = process.env.APP_BASE_URL || 'http://localhost:3000';
const STRIPE_CONFIG = {
  // Currency settings
  currency: 'cad', // Canadian Dollar for flower store
  
  // Payment method types
  paymentMethodTypes: ['card'],
  
  // Success and cancel URLs (will be set dynamically based on environment)
  successUrl: `${APP_BASE}/checkout/success`,
  
  cancelUrl: `${APP_BASE}/checkout/cancel`,
  
  // Webhook settings
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  
  // Billing address collection
  billingAddressCollection: 'required',
  
  // Shipping address collection (for delivery orders)
  shippingAddressCollection: {
    allowed_countries: ['CA', 'US'], // Canada and US only
  }
};

// Helper function to create line items for Stripe checkout
const createLineItems = (items) => {
  // Calculate total amount for all items
  const totalAmount = items.reduce((total, item) => {
    if (!item.price || item.price <= 0) {
      throw new Error(`Invalid price for item ${item.name}: ${item.price}`);
    }
    return total + (item.price * (item.quantity || 1));
  }, 0);

  console.log('Creating single line item with total:', {
    totalAmount,
    itemCount: items.length,
    breakdown: items.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity
    }))
  });

  // Create a single line item with the total amount
  return [{
    price_data: {
      currency: STRIPE_CONFIG.currency,
      product_data: {
        name: `Order Total (${items.length} items)`,
        description: items.map(item => 
          `${item.name} x${item.quantity}`
        ).join(', ')
      },
      unit_amount: totalAmount,
    },
    quantity: 1,
  }];
};

// Helper function to create Stripe checkout session
const createCheckoutSession = async (orderData) => {
  const {
    orderId,
    items,
    total,
    customerEmail,
    deliveryMethod,
    deliveryAddress,
    metadata = {}
  } = orderData;

  const sessionConfig = {
    payment_method_types: STRIPE_CONFIG.paymentMethodTypes,
    line_items: createLineItems(items),
    mode: 'payment',
    success_url: `${STRIPE_CONFIG.successUrl}?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
    cancel_url: `${STRIPE_CONFIG.cancelUrl}?order_id=${orderId}`,
    customer_email: customerEmail,
    billing_address_collection: STRIPE_CONFIG.billingAddressCollection,
    metadata: {
      orderId: orderId.toString(),
      ...metadata
    }
  };

  // Add shipping address collection for delivery orders
  if (deliveryMethod === 'delivery') {
    sessionConfig.shipping_address_collection = STRIPE_CONFIG.shippingAddressCollection;
  }

  return await stripe.checkout.sessions.create(sessionConfig);
};

// Helper function to retrieve checkout session
const retrieveCheckoutSession = async (sessionId) => {
  return await stripe.checkout.sessions.retrieve(sessionId);
};

// Helper function to retrieve payment intent
const retrievePaymentIntent = async (paymentIntentId) => {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
};

// Helper function to construct webhook event
const constructWebhookEvent = (payload, signature) => {
  // Support multiple secrets to handle test vs. live webhooks
  const candidateSecrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_TEST,
    process.env.STRIPE_WEBHOOK_SECRET_LIVE
  ].filter(Boolean);

  if (candidateSecrets.length === 0) {
    throw new Error('No STRIPE_WEBHOOK_SECRET configured');
  }

  const errors = [];
  for (const secret of candidateSecrets) {
    try {
      return stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (err) {
      errors.push(err.message);
    }
  }

  throw new Error(`Webhook signature verification failed for all configured secrets: ${errors.join(' | ')}`);
};

module.exports = {
  stripe,
  STRIPE_CONFIG,
  createLineItems,
  createCheckoutSession,
  retrieveCheckoutSession,
  retrievePaymentIntent,
  constructWebhookEvent
};
