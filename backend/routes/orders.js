const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole, requireShopOwnership } = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

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
    if (req.user.role === 'customer' && order.customerId !== req.user._id) {
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
  try {
    const {
      shopId,
      items,
      delivery,
      notes
    } = req.body;
    
    // Validate required fields
    if (!shopId || !items || !delivery) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID, items, and delivery information are required'
      });
    }
    
    // Verify shop exists and is active
    const shop = await Shop.findById(shopId);
    if (!shop || !shop.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Shop not found or inactive'
      });
    }
    
    // Validate and process items
    let subtotal = 0;
    const processedItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive || product.shopId.toString() !== shopId) {
        return res.status(400).json({
          success: false,
          error: `Product ${item.productId} not found or not available from this shop`
        });
      }
      
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${product.name}. Available: ${product.quantity}`
        });
      }
      
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      
      processedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal
      });
    }
    
    // Calculate totals
    const taxAmount = Math.round(subtotal * shop.taxRate);
    const deliveryFee = delivery.method === 'delivery' ? shop.deliveryOptions.deliveryFee : 0;
    const total = subtotal + taxAmount + deliveryFee;
    
    // Create order
    const order = new Order({
      customerId: req.user._id,
      shopId,
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
    
    // Update product quantities
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: -item.quantity }
      });
    }
    
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

module.exports = router;
