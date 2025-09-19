const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { 
  createCheckoutSession, 
  retrieveCheckoutSession, 
  constructWebhookEvent,
  stripe 
} = require('../config/stripe');
const { calculateDeliveryFee } = require('../utils/deliveryFeeCalculator');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

/**
 * POST /api/stripe/create-checkout-session
 * Create a Stripe checkout session for an order
 * Requires customer authentication
 */
router.post('/create-checkout-session', authenticateToken, requireRole('customer'), async (req, res) => {
  try {
    
    const {
      shopId,
      items,
      delivery,
      notes,
      recipient,
      occasion,
      cardMessage
    } = req.body;
    
    // Validate required fields
    if (!shopId || !items || !delivery) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID, items, and delivery information are required'
      });
    }
    
    // Validate delivery/pickup information
    if (!delivery.method || !['delivery', 'pickup'].includes(delivery.method)) {
      return res.status(400).json({
        success: false,
        error: 'Valid delivery method (delivery or pickup) is required'
      });
    }

    // Debug logging
    console.log('=== RECEIVED ORDER DATA ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    console.log('Delivery data:', JSON.stringify(delivery, null, 2));
    console.log('Recipient (root) data:', JSON.stringify(recipient, null, 2));
    console.log('Recipient (delivery.recipient) data:', JSON.stringify(delivery && delivery.recipient, null, 2));
    console.log('Method:', delivery.method);
    console.log('Delivery option:', delivery.deliveryOption);

    // Validate recipient information (prefer root recipient, fallback to delivery.recipient for compatibility)
    const recipientData = recipient || (delivery ? delivery.recipient : null) || {};
    if (!recipientData.name || !recipientData.phone || !recipientData.email) {
      return res.status(400).json({
        success: false,
        error: 'Recipient name, phone, and email are required',
        debug: {
          recipient: recipientData,
          delivery
        }
      });
    }

    // Validate contact information
    if (!delivery.contactPhone || !delivery.contactEmail) {
      return res.status(400).json({
        success: false,
        error: 'Contact phone and email are required'
      });
    }

    // Validate date and time
    if (!delivery.date || !delivery.time) {
      return res.status(400).json({
        success: false,
        error: 'Date and time are required'
      });
    }

    // Validate future date
    const deliveryDate = new Date(delivery.date);
    if (deliveryDate <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Date must be in the future'
      });
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(delivery.time)) {
      return res.status(400).json({
        success: false,
        error: 'Time must be in 24-hour format (HH:MM)'
      });
    }

    // Validate delivery-specific fields
    if (delivery.method === 'delivery') {
      const { address } = delivery;
      if (!address?.street || !address?.city || !address?.province || !address?.postalCode) {
        return res.status(400).json({
          success: false,
          error: 'Complete delivery address is required'
        });
      }

      // Validate postal code format
      const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
      if (!postalCodeRegex.test(address.postalCode)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid postal code format'
        });
      }

      // Validate province
      const validProvinces = ['QC', 'ON', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'YT', 'NT', 'NU'];
      if (!validProvinces.includes(address.province)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid province'
        });
      }
    }

    // Debug logging
    console.log('Received delivery data:', JSON.stringify(delivery, null, 2));
    
    // Compute delivery fee based on postal code lookup (in cents)
    let computedDeliveryFee = 0;
    if (delivery.method === 'delivery') {
      const feeResult = calculateDeliveryFee(delivery.address.postalCode);
      if (!feeResult.success) {
        return res.status(400).json({
          success: false,
          error: feeResult.error || 'Delivery is not available for the provided postal code'
        });
      }
      // Lookup table returns dollars; convert to cents
      computedDeliveryFee = Math.round(feeResult.fee * 100);
    }
    
    // Verify shop exists and is active
    console.log('Looking for shop with ID:', shopId);
    const shop = await Shop.findById(shopId);
    console.log('Found shop:', shop ? 'YES' : 'NO');
    
    if (!shop || !shop.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Shop not found or inactive',
        debug: {
          shopId,
          shopExists: !!shop,
          shopActive: shop ? shop.isActive : false
        }
      });
    }
    
    // Validate and process items
    let subtotal = 0;
    const processedItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || product.shopId.toString() !== shopId) {
        return res.status(400).json({
          success: false,
          error: `Product ${item.productId} not found or not available from this shop`
        });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }
      
      // Handle tiered pricing - use variants first, fallback to legacy price
      let productPrice = 0;
      console.log(`Processing product ${product._id}:`, {
        name: product.name,
        variants: product.variants,
        legacyPrice: product.price
      });
      
      if (product.variants && product.variants.length > 0) {
        // Use the first active variant's price
        const activeVariant = product.variants.find(v => v.isActive && v.stock > 0);
        productPrice = activeVariant ? activeVariant.price : 0;
        console.log(`Using variant price: ${productPrice} from variant:`, activeVariant);
      } else {
        // Fallback to legacy price structure
        productPrice = product.price.standard || product.price.deluxe || product.price.premium || 0;
        console.log(`Using legacy price: ${productPrice}`);
      }
      const itemTotal = productPrice * item.quantity;
      subtotal += itemTotal;
      
      processedItems.push({
        productId: product._id,
        name: product.name,
        price: productPrice,
        quantity: item.quantity,
        total: itemTotal,
        image: product.images && product.images.length > 0 ? product.images[0] : null
      });
    }
    
    // Calculate totals with Québec tax (14.975% on products + delivery)
    const QUEBEC_TAX_RATE = 0.14975; // Combined GST (5%) + QST (9.975%)
    const taxableAmount = subtotal + computedDeliveryFee;
    const taxAmount = Math.round(taxableAmount * QUEBEC_TAX_RATE);
    const total = taxableAmount + taxAmount;
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Create order first (without payment details)
    console.log('=== CREATING ORDER ===');
    console.log('User ID for order creation:', req.user._id, 'Type:', typeof req.user._id);
    console.log('User email:', req.user.email);
    
    const order = new Order({
      customerId: req.user._id,
      shopId,
      orderNumber,
      items: processedItems,
      subtotal,
      taxAmount,
      deliveryFee: computedDeliveryFee,
      total,
      recipient: {
        name: recipientData.name,
        phone: recipientData.phone,
        email: recipientData.email
      },
      occasion: occasion || undefined,
      cardMessage: cardMessage || undefined,
      delivery,
      notes,
      payment: {
        status: 'pending'
      }
    });
    
    const savedOrder = await order.save();
    console.log('Order created with ID:', savedOrder._id);
    console.log('Order customer ID:', savedOrder.customerId, 'Type:', typeof savedOrder.customerId);
    
    // Reduce stock immediately in development (since webhooks can't reach localhost)
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Reducing stock immediately');
      for (const item of items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity }
        });
        console.log(`Reduced stock for product ${item.productId} by ${item.quantity}`);
      }
    }
    
    // Create Stripe checkout session
    // Build Stripe line items: products + delivery fee + tax
    const stripeItems = [
      ...processedItems,
      ...(computedDeliveryFee > 0 ? [{ name: 'Delivery fee', price: computedDeliveryFee, quantity: 1 }] : []),
      ...(taxAmount > 0 ? [{ name: 'Tax', price: taxAmount, quantity: 1 }] : [])
    ];

    const sessionData = {
      orderId: savedOrder._id,
      items: stripeItems,
      total,
      customerEmail: delivery.contactEmail,
      deliveryMethod: delivery.method,
      deliveryAddress: delivery.address,
      metadata: {
        shopId: shopId.toString(),
        customerId: req.user._id.toString()
      }
    };
    
    console.log('Creating Stripe session with data:', JSON.stringify(sessionData, null, 2));
    
    const session = await createCheckoutSession(sessionData);
    
    console.log('Stripe session created:', session.id);
    
    // Update order with session ID
    savedOrder.payment.sessionId = session.id;
    await savedOrder.save();
    
    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      orderId: savedOrder._id
    });
    
  } catch (error) {
    console.error('=== STRIPE CHECKOUT SESSION ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: messages
      });
    }
    
    // Handle Stripe-specific errors
    if (error.type && error.type.startsWith('Stripe')) {
      return res.status(400).json({
        success: false,
        error: `Stripe error: ${error.message}`,
        details: error
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/stripe/checkout-session/:sessionId
 * Retrieve checkout session details
 * Requires authentication
 */
router.get('/checkout-session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Retrieve session from Stripe
    const session = await retrieveCheckoutSession(sessionId);
    
    // Find the associated order
    const order = await Order.findOne({ 'payment.sessionId': sessionId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found for this session'
      });
    }
    
    // Check access permissions
    console.log('=== ORDER ACCESS CHECK ===');
    console.log('User ID:', req.user._id, 'Type:', typeof req.user._id);
    console.log('Order Customer ID:', order.customerId, 'Type:', typeof order.customerId);
    console.log('User ID String:', req.user._id.toString());
    console.log('Order Customer ID String:', order.customerId.toString());
    console.log('Are they equal?', order.customerId.toString() === req.user._id.toString());
    console.log('User Role:', req.user.role);
    
    if (req.user.role === 'customer' && order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only view your own orders',
        debug: {
          userId: req.user._id.toString(),
          orderCustomerId: order.customerId.toString(),
          userIdType: typeof req.user._id,
          orderCustomerIdType: typeof order.customerId,
          areEqual: order.customerId.toString() === req.user._id.toString()
        }
      });
    }
    
    res.json({
      success: true,
      session: {
        id: session.id,
        status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_email,
        payment_status: session.payment_status
      },
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total
      }
    });
    
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve checkout session'
    });
  }
});

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 * No authentication required (uses webhook signature verification)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  // Skip signature verification in development for testing
  if (process.env.NODE_ENV === 'development' && !sig) {
    console.log('Development mode: Skipping webhook signature verification');
    try {
      event = JSON.parse(req.body.toString());
    } catch (err) {
      console.error('Failed to parse webhook body:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    try {
      event = constructWebhookEvent(req.body, sig);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
        
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

/**
 * POST /api/stripe/test-webhook
 * Test webhook endpoint without signature verification
 * For development testing only
 */
router.post('/test-webhook', express.json(), async (req, res) => {
  try {
    console.log('Test webhook received:', req.body);
    
    const event = req.body;
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
        
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true, message: 'Test webhook processed successfully' });
  } catch (error) {
    console.error('Error handling test webhook:', error);
    res.status(500).json({ error: 'Test webhook handler failed' });
  }
});

// Webhook event handlers
async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('Processing checkout.session.completed:', session.id);
    
    // Find the order associated with this session
    const order = await Order.findOne({ 'payment.sessionId': session.id });
    
    if (!order) {
      console.error('Order not found for session:', session.id);
      return;
    }
    
    // Update order payment status
    order.payment.status = 'succeeded';
    order.payment.intentId = session.payment_intent;
    order.payment.paidAt = new Date();
    order.status = 'confirmed';
    order.confirmedAt = new Date();
    
    await order.save();
    
    // Create payment record
    const payment = new Payment({
      stripePaymentIntentId: session.payment_intent,
      stripeSessionId: session.id,
      orderId: order._id,
      customerId: order.customerId,
      amount: session.amount_total,
      currency: session.currency,
      status: 'succeeded',
      paidAt: new Date(),
      stripeCustomerId: session.customer,
      metadata: {
        shopId: order.shopId.toString(),
        orderNumber: order.orderNumber
      }
    });
    
    await payment.save();
    
    // Update product stock (skip in development since it was already reduced)
    if (process.env.NODE_ENV !== 'development') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity }
        });
      }
    } else {
      console.log('Development mode: Skipping stock reduction in webhook (already reduced)');
    }
    
    console.log('Order confirmed and payment recorded:', order._id);
    
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    console.log('Processing payment_intent.succeeded:', paymentIntent.id);
    
    // Find the payment record
    const payment = await Payment.findOne({ 
      stripePaymentIntentId: paymentIntent.id 
    });
    
    if (payment) {
      payment.status = 'succeeded';
      payment.paidAt = new Date();
      await payment.save();
    }
    
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    console.log('Processing payment_intent.payment_failed:', paymentIntent.id);
    
    // Find the order and payment record
    const payment = await Payment.findOne({ 
      stripePaymentIntentId: paymentIntent.id 
    });
    
    if (payment) {
      payment.status = 'failed';
      payment.failedAt = new Date();
      payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
      await payment.save();
      
      // Update order status
      const order = await Order.findById(payment.orderId);
      if (order) {
        order.payment.status = 'failed';
        order.payment.failureReason = payment.failureReason;
        order.status = 'cancelled';
        order.cancelledAt = new Date();
        await order.save();
      }
    }
    
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

module.exports = router;
