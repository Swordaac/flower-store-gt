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
      
      // Helper function to sanitize object for JSON
      const sanitizeForJSON = (obj) => {
        const seen = new WeakSet();
        return JSON.parse(JSON.stringify(obj, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              return '[Circular]';
            }
            seen.add(value);
          }
          // Convert MongoDB ObjectId to string
          if (value && value._bsontype === 'ObjectId') {
            return value.toString();
          }
          return value;
        }));
      };
      
      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product || product.shopId.toString() !== shopId) {
          return res.status(400).json({
            success: false,
            error: `Product ${item.productId} not found or not available from this shop`
          });
        }
        
        // Determine selected variant and validate stock per tier
        let chosenVariant = null;
        let resolvedSelectedTier = item.selectedTier || null;
        
        if (Array.isArray(product.variants) && product.variants.length > 0) {
          if (resolvedSelectedTier) {
            chosenVariant = product.variants.find(v => v.tierName === resolvedSelectedTier && v.isActive);
            if (!chosenVariant) {
              return res.status(400).json({
                success: false,
                error: `Selected tier ${resolvedSelectedTier} not available for ${product.name}`
              });
            }
          } else {
            // Default to any active variant with stock
            chosenVariant = product.variants.find(v => v.isActive && v.stock > 0) || null;
            resolvedSelectedTier = chosenVariant ? chosenVariant.tierName : null;
          }
          
          if (!chosenVariant || chosenVariant.stock <= 0 || chosenVariant.stock < item.quantity) {
            return res.status(400).json({
              success: false,
              error: `Insufficient stock for ${product.name}${resolvedSelectedTier ? ` (${resolvedSelectedTier})` : ''}. Available: ${chosenVariant ? chosenVariant.stock : 0}`
            });
          }
        }
        
        // Sanitize product data
        const sanitizedProduct = sanitizeForJSON(product);
      
      // Handle tiered pricing based on cart selection
      let productPrice = 0;
      console.log(`Processing product ${sanitizedProduct._id}:`, {
        name: sanitizedProduct.name,
        variants: sanitizedProduct.variants,
        legacyPrice: sanitizedProduct.price,
        selectedTier: item.selectedTier,
        selectedSize: item.selectedSize,
        cartPrice: item.price
      });
      
      // First try to use the price from cart item, but validate it
      if (item.price) {
        let expectedPrice = 0;
        
        // Calculate expected price based on selection
        if (item.selectedTier) {
          // Prefer variants when tier provided
          const tierVariant = Array.isArray(product.variants) 
            ? product.variants.find(v => v.tierName === item.selectedTier && v.isActive)
            : null;
          expectedPrice = (tierVariant && tierVariant.price) || (product.price && product.price[item.selectedTier]) || 0;
        } else if (item.selectedSize) {
          expectedPrice = item.selectedSize;
        } else if (product.variants && product.variants.length > 0) {
          const activeVariant = product.variants.find(v => v.isActive && v.stock > 0);
          expectedPrice = activeVariant ? activeVariant.price : 0;
        } else {
          expectedPrice = product.price.standard || product.price.deluxe || product.price.premium || 0;
        }
        
        // Compare cart price with expected price
        if (expectedPrice !== item.price) {
          console.error(`Price mismatch for ${product.name}:`, {
            cartPrice: item.price,
            expectedPrice,
            selectedTier: item.selectedTier,
            selectedSize: item.selectedSize
          });
          return res.status(400).json({
            success: false,
            error: `Price mismatch for ${product.name}. Please try adding the item to cart again.`
          });
        }
        
        productPrice = item.price;
        console.log(`Validated cart price: ${productPrice}`);
      }
      // If no cart price, calculate based on selection
      else if (item.selectedTier) {
        const tierVariant = Array.isArray(product.variants) 
          ? product.variants.find(v => v.tierName === item.selectedTier && v.isActive)
          : null;
        productPrice = (tierVariant && tierVariant.price) || (product.price && product.price[item.selectedTier]) || 0;
        console.log(`Using selected tier price: ${productPrice} for tier ${item.selectedTier}`);
      }
      else if (item.selectedSize) {
        productPrice = item.selectedSize; // selectedSize is already in cents
        console.log(`Using selected size price: ${productPrice}`);
      }
      else if (product.variants && product.variants.length > 0) {
        const activeVariant = product.variants.find(v => v.isActive && v.stock > 0);
        productPrice = activeVariant ? activeVariant.price : 0;
        console.log(`Using variant price: ${productPrice} from variant:`, activeVariant);
      }
      else {
        // Fallback to legacy price structure
        productPrice = product.price.standard || product.price.deluxe || product.price.premium || 0;
        console.log(`Using legacy price: ${productPrice}`);
      }

      // Validate that we have a valid price
      if (productPrice <= 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid price for product ${product.name}`
        });
      }

      const itemTotal = productPrice * item.quantity;
      subtotal += itemTotal;
      
      // Create a clean item object without any circular references
      const processedItem = {
        productId: sanitizedProduct._id,
        name: `${sanitizedProduct.name}${item.selectedTier ? ` (${item.selectedTier})` : ''}`,
        selectedTier: item.selectedTier || resolvedSelectedTier || undefined,
        price: productPrice,
        quantity: item.quantity,
        total: itemTotal,
        image: sanitizedProduct.images && sanitizedProduct.images.length > 0 ? 
          (typeof sanitizedProduct.images[0] === 'string' ? sanitizedProduct.images[0] : sanitizedProduct.images[0].url) : 
          null
      };
      
      // Verify the object can be serialized
      try {
        JSON.stringify(processedItem);
        processedItems.push(processedItem);
      } catch (error) {
        console.error('Failed to serialize processed item:', error);
        console.error('Problematic item:', processedItem);
        return res.status(500).json({
          success: false,
          error: 'Failed to process item data',
          details: error.message
        });
      }
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
    
    // Atomically reserve stock per tier now to prevent race conditions
    // We do this immediately after order creation; mark order as stockReserved on success
    let allReserved = true;
    for (const item of processedItems) {
      if (item.selectedTier) {
        const updateResult = await Product.updateOne(
          {
            _id: item.productId,
            variants: {
              $elemMatch: {
                tierName: item.selectedTier,
                isActive: true,
                stock: { $gte: item.quantity }
              }
            }
          },
          { $inc: { 'variants.$.stock': -item.quantity } }
        );
        if (!updateResult.modifiedCount) {
          allReserved = false;
          break;
        }
      }
    }

    if (!allReserved) {
      // Roll back any partial reservations
      for (const item of processedItems) {
        if (item.selectedTier) {
          await Product.updateOne(
            { _id: item.productId, 'variants.tierName': item.selectedTier },
            { $inc: { 'variants.$.stock': item.quantity } }
          );
        }
      }
      // Cancel order and inform client
      savedOrder.status = 'cancelled';
      savedOrder.cancelledAt = new Date();
      await savedOrder.save();
      return res.status(409).json({
        success: false,
        error: 'One or more items just went out of stock. Your cart has been updated. Please review and try again.'
      });
    }

    // Mark reservation on order
    savedOrder.stockReserved = true;
    await savedOrder.save();
    
    // Debug log all pricing components
    console.log('=== FINAL PRICING BREAKDOWN ===');
    console.log('Processed Items:', processedItems.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.total
    })));
    console.log('Subtotal:', subtotal);
    console.log('Delivery Fee:', computedDeliveryFee);
    console.log('Tax Amount:', taxAmount);
    console.log('Total:', total);

    // Calculate final total including all fees and taxes
    const finalTotal = total; // total is already calculated including tax and delivery

    // Create a single line item with the final total
    const stripeItems = [{
      name: 'Order Total',
      price: finalTotal,
      quantity: 1,
      description: `${processedItems.length} items, including taxes and ${delivery.method === 'delivery' ? 'delivery' : 'pickup'}`
    }];

    // Debug log the final line items
    console.log('=== STRIPE LINE ITEMS (Pre-conversion) ===');
    stripeItems.forEach(item => {
      console.log(`Item: ${item.name}`);
      console.log(`  Price: ${item.price} cents`);
      console.log(`  Quantity: ${item.quantity}`);
      console.log(`  Total: ${item.price * item.quantity} cents`);
    });
    
    // Debug log Stripe line items
    console.log('=== STRIPE LINE ITEMS ===');
    console.log(JSON.stringify(stripeItems, null, 2));

    // Prepare and validate session data
    const sessionData = {
      orderId: savedOrder._id.toString(), // Convert ObjectId to string
      items: stripeItems.map(item => ({
        ...item,
        productId: item.productId ? item.productId.toString() : undefined // Convert ObjectId to string if present
      })),
      total,
      customerEmail: delivery.contactEmail,
      deliveryMethod: delivery.method,
      deliveryAddress: delivery.address ? sanitizeForJSON(delivery.address) : undefined,
      metadata: {
        shopId: shopId.toString(),
        customerId: req.user._id.toString(),
        orderNumber: savedOrder.orderNumber
      }
    };

    // Verify the session data can be serialized
    try {
      JSON.stringify(sessionData);
    } catch (error) {
      console.error('Failed to serialize session data:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to prepare checkout data',
        details: error.message
      });
    }
    
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
    
    // Guard against double-decrement: stock was already reserved at session creation
    if (!order.stockReserved) {
      console.warn('Order not marked as stockReserved during session creation; skipping additional stock update to avoid inconsistencies.');
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

        // Release reserved stock if previously reserved
        if (order.stockReserved) {
          for (const item of order.items) {
            if (item.selectedTier) {
              await Product.updateOne(
                { _id: item.productId, 'variants.tierName': item.selectedTier },
                { $inc: { 'variants.$.stock': item.quantity } }
              );
            }
          }
          order.stockReserved = false;
          await order.save();
        }
      }
    }
    
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

module.exports = router;
