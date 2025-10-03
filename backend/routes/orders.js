const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole, requireShopOwnership } = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const printService = require('../services/printService');

/**
 * GET /api/orders - Get orders (filtered by user role)
 * Customers see their own orders, shop owners see shop orders, admins see all
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      shopId, 
      startDate, 
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build filter based on user role
    let filter = {};
    
    if (req.user.role === 'customer') {
      // Customers can only see their own orders
      filter.customerId = req.user._id;
    } else if (req.user.role === 'shop_owner') {
      // Shop owners can only see orders from their shops
      const userShops = await Shop.find({ ownerId: req.user._id }).select('_id');
      const shopIds = userShops.map(shop => shop._id);
      filter.shopId = { $in: shopIds };
    }
    // Admins can see all orders (no filter)
    
    // Additional filters
    if (status) filter.status = status;
    if (shopId) filter.shopId = shopId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const orders = await Order.find(filter)
      .populate('shopId', 'name address.city address.state')
      .populate('customerId', 'name email')
      .select('-__v')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Order.countDocuments(filter);
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

/**
 * GET /api/orders/:id - Get single order by ID
 * Customers can only see their own orders, shop owners can see shop orders
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('shopId', 'name address.city address.state')
      .populate('customerId', 'name email')
      .select('-__v');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check access permissions
    if (req.user.role === 'customer' && order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only view your own orders'
      });
    }
    
    if (req.user.role === 'shop_owner') {
      const shop = await Shop.findOne({ _id: order.shopId, ownerId: req.user._id });
      if (!shop) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You can only view orders from your shops'
        });
      }
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

/**
 * POST /api/orders - Create new order
 * Requires customer authentication
 */
router.post('/', authenticateToken, requireRole('customer'), async (req, res) => {
  console.log('📝 Order creation API called');
  try {
    const {
      shopId,
      items,
      delivery,
      notes,
      recipient
    } = req.body;
    
    console.log('📝 Order data received:', {
      shopId,
      itemsCount: items?.length,
      deliveryMethod: delivery?.method,
      recipientName: recipient?.name
    });
    
    // Validate required fields
    if (!shopId || !items || !delivery || !recipient) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID, items, delivery information, and recipient information are required'
      });
    }

    // Validate recipient information
    if (!recipient.name || !recipient.phone || !recipient.email) {
      return res.status(400).json({
        success: false,
        error: 'Recipient name, phone, and email are required'
      });
    }
    
    // Validate delivery/pickup information
    if (!delivery.method || !['delivery', 'pickup'].includes(delivery.method)) {
      return res.status(400).json({
        success: false,
        error: 'Valid delivery method (delivery or pickup) is required'
      });
    }
    
    if (!delivery.contactPhone || !delivery.contactEmail) {
      return res.status(400).json({
        success: false,
        error: 'Contact phone and email are required'
      });
    }
    
    // Validate delivery-specific requirements
    if (delivery.method === 'delivery') {
      if (!delivery.address || !delivery.address.street || !delivery.address.city || 
          !delivery.address.province || !delivery.address.postalCode) {
        return res.status(400).json({
          success: false,
          error: 'Complete delivery address is required for delivery orders'
        });
      }
      if (!delivery.time) {
        return res.status(400).json({
          success: false,
          error: 'Delivery time is required for delivery orders'
        });
      }
    }
    
    // Validate pickup-specific requirements
    if (delivery.method === 'pickup') {
      // No additional validation needed for single store setup
    }
    
    // Verify shop exists and is active
    const shop = await Shop.findById(shopId);
    if (!shop || !shop.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Shop not found or inactive'
      });
    }
    
    // Pickup location verification removed for single store setup
    
    // Check if delivery method is supported by shop
    if (delivery.method === 'delivery' && !shop.deliveryOptions.delivery) {
      return res.status(400).json({
        success: false,
        error: 'Delivery is not available from this shop'
      });
    }
    
    if (delivery.method === 'pickup' && !shop.deliveryOptions.pickup) {
      return res.status(400).json({
        success: false,
        error: 'Pickup is not available from this shop'
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
      
      // Stock validation removed - stock is infinite
      
      // Handle tiered pricing - use variants first, fallback to legacy price
      let itemPrice = 0;
      if (product.variants && product.variants.length > 0) {
        // Use the first active variant's price
        const activeVariant = product.variants.find(v => v.isActive && v.stock > 0);
        itemPrice = activeVariant ? activeVariant.price : 0;
      } else {
        // Fallback to legacy price structure
        itemPrice = product.price.standard || product.price.deluxe || product.price.premium || 0;
      }
      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;
      
      processedItems.push({
        productId: product._id,
        name: product.name,
        price: itemPrice,
        quantity: item.quantity,
        total: itemTotal
      });
    }
    
    // Calculate totals
    const taxAmount = Math.round(subtotal * shop.taxRate);
    const deliveryFee = delivery.method === 'delivery' ? shop.deliveryOptions.deliveryFee : 0;
    const total = subtotal + taxAmount + deliveryFee;
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Create order
    const order = new Order({
      customerId: req.user._id,
      shopId,
      orderNumber,
      recipient: {
        name: recipient.name,
        phone: recipient.phone,
        email: recipient.email
      },
      items: processedItems,
      subtotal,
      taxAmount,
      deliveryFee,
      total,
      delivery,
      notes,
      payment: {
        intentId: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Placeholder
        method: 'card',
        status: 'pending'
      }
    });
    
    const savedOrder = await order.save();
    console.log('✅ Order saved successfully:', savedOrder.orderNumber);
    
    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }
    console.log('✅ Product stock updated');

    // Print order details asynchronously (don't wait for completion)
    console.log(`🖨️ Triggering print job for order ${savedOrder.orderNumber}...`);
    printService.printOrderDetails(savedOrder)
      .then(result => {
        if (result.success) {
          console.log(`✅ Print job submitted successfully for order ${savedOrder.orderNumber}:`, result);
        } else {
          console.error(`❌ Failed to print order ${savedOrder.orderNumber}:`, result.error);
        }
      })
      .catch(error => {
        console.error(`❌ Error printing order ${savedOrder.orderNumber}:`, error);
      });
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: savedOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: messages
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

/**
 * PUT /api/orders/:id/status - Update order status
 * Requires shop ownership or admin role
 */
router.put('/:id/status', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    
    if (!['confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }
    
    // Check access permissions
    if (req.user.role === 'shop_owner') {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }
      
      const shop = await Shop.findOne({ _id: order.shopId, ownerId: req.user._id });
      if (!shop) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You can only update orders from your shops'
        });
      }
    }
    
    // Update status and timestamp
    const updateData = { status };
    const timestampField = `${status}At`;
    updateData[timestampField] = new Date();
    
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
});

/**
 * PUT /api/orders/:id/payment - Update payment information
 * Requires shop ownership or admin role
 */
router.put('/:id/payment', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    const { paymentStatus, paymentMethod, paidAt } = req.body;
    const orderId = req.params.id;
    
    // Check access permissions
    if (req.user.role === 'shop_owner') {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }
      
      const shop = await Shop.findOne({ _id: order.shopId, ownerId: req.user._id });
      if (!shop) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You can only update orders from your shops'
        });
      }
    }
    
    const updateData = {};
    if (paymentStatus) updateData['payment.status'] = paymentStatus;
    if (paymentMethod) updateData['payment.method'] = paymentMethod;
    if (paidAt) updateData['payment.paidAt'] = new Date(paidAt);
    
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Payment information updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error updating payment information:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment information'
    });
  }
});

/**
 * GET /api/orders/shop/:shopId - Get orders for specific shop
 * Requires shop ownership or admin role
 */
router.get('/shop/:shopId', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    const { shopId } = req.params;
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    
    // Check access permissions
    if (req.user.role === 'shop_owner') {
      const shop = await Shop.findOne({ _id: shopId, ownerId: req.user._id });
      if (!shop) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You can only view orders from your shops'
        });
      }
    }
    
    // Build filter
    let filter = { shopId };
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const orders = await Order.find(filter)
      .populate('customerId', 'name email')
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Order.countDocuments(filter);
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching shop orders:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shop orders'
    });
  }
});

/**
 * POST /api/orders/:id/print - Print order details
 * Requires shop ownership or admin role
 */
router.post('/:id/print', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // Check access permissions
    if (req.user.role === 'shop_owner') {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }
      
      const shop = await Shop.findOne({ _id: order.shopId, ownerId: req.user._id });
      if (!shop) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You can only print orders from your shops'
        });
      }
    }

    // Get the order with populated data
    const order = await Order.findById(orderId)
      .populate('shopId', 'name address.city address.state')
      .populate('customerId', 'name email')
      .select('-__v');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Print the order details
    const printResult = await printService.printOrderDetails(order);
    
    res.json({
      success: printResult.success,
      message: printResult.message,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        printJobId: printResult.printJobId,
        printerId: printResult.printerId
      },
      error: printResult.error
    });

  } catch (error) {
    console.error('Error printing order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to print order'
    });
  }
});

/**
 * GET /api/orders/print/test - Test PrintNode connection
 * Requires admin role
 */
router.get('/print/test', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const testResult = await printService.testConnection();
    
    res.json({
      success: testResult.success,
      message: testResult.message,
      data: testResult.account,
      error: testResult.error
    });
  } catch (error) {
    console.error('Error testing PrintNode connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test PrintNode connection'
    });
  }
});

/**
 * GET /api/orders/print/printers - Get available printers
 * Requires admin role
 */
router.get('/print/printers', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const printers = await printService.getPrinters();
    
    res.json({
      success: true,
      data: printers
    });
  } catch (error) {
    console.error('Error fetching printers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch printers'
    });
  }
});

/**
 * GET /api/orders/print/stats - Get print job statistics
 * Requires admin role
 */
router.get('/print/stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const stats = printService.getPrintJobStats(parseInt(days));
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching print job stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch print job statistics'
    });
  }
});

module.exports = router;
