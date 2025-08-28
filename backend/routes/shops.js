const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole, requireShopOwnership } = require('../middleware/auth');
const Shop = require('../models/Shop');

/**
 * GET /api/shops - Get all shops (public)
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, city, state, category, search } = req.query;
    
    // Build filter
    let filter = { isActive: true };
    if (city) filter['address.city'] = { $regex: city, $options: 'i' };
    if (state) filter['address.state'] = { $regex: state, $options: 'i' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const shops = await Shop.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Shop.countDocuments(filter);
    
    res.json({
      success: true,
      data: shops,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shops'
    });
  }
});

/**
 * GET /api/shops/:id - Get shop by ID (public)
 */
router.get('/:id', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .select('-__v')
      .populate('ownerId', 'name email');
    
    if (!shop || !shop.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }
    
    res.json({
      success: true,
      data: shop
    });
  } catch (error) {
    console.error('Error fetching shop:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shop'
    });
  }
});

/**
 * POST /api/shops - Create new shop
 * Requires shop_owner or admin role
 */
router.post('/', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    const {
      name,
      description,
      phone,
      email,
      address,
      location,
      currency,
      taxRate,
      deliveryOptions,
      businessHours
    } = req.body;
    
    // Check if user already owns a shop
    const existingShop = await Shop.findOne({ ownerId: req.user.supabaseUserId });
    if (existingShop && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'You already own a shop'
      });
    }
    
    const shop = new Shop({
      name,
      description,
      phone,
      email,
      address,
      location,
      currency,
      taxRate,
      deliveryOptions,
      businessHours,
      ownerId: req.user.supabaseUserId
    });
    
    const savedShop = await shop.save();
    
    res.status(201).json({
      success: true,
      message: 'Shop created successfully',
      data: savedShop
    });
  } catch (error) {
    console.error('Error creating shop:', error);
    
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
      error: 'Failed to create shop'
    });
  }
});

/**
 * PUT /api/shops/:id - Update shop
 * Requires shop ownership or admin role
 */
router.put('/:id', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    const shopId = req.params.id;
    
    // Check ownership (unless admin)
    if (req.user.role !== 'admin') {
      const shop = await Shop.findOne({ _id: shopId, ownerId: req.user.supabaseUserId });
      if (!shop) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Shop not found or not owned by user'
        });
      }
    }
    
    const updateData = { ...req.body };
    delete updateData.ownerId; // Prevent changing ownership
    
    const updatedShop = await Shop.findByIdAndUpdate(
      shopId,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!updatedShop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Shop updated successfully',
      data: updatedShop
    });
  } catch (error) {
    console.error('Error updating shop:', error);
    
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
      error: 'Failed to update shop'
    });
  }
});

/**
 * DELETE /api/shops/:id - Deactivate shop
 * Requires shop ownership or admin role
 */
router.delete('/:id', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    const shopId = req.params.id;
    
    // Check ownership (unless admin)
    if (req.user.role !== 'admin') {
      const shop = await Shop.findOne({ _id: shopId, ownerId: req.user.supabaseUserId });
      if (!shop) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Shop not found or not owned by user'
        });
      }
    }
    
    const shop = await Shop.findByIdAndUpdate(
      shopId,
      { isActive: false },
      { new: true }
    ).select('-__v');
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Shop deactivated successfully',
      data: shop
    });
  } catch (error) {
    console.error('Error deactivating shop:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate shop'
    });
  }
});

/**
 * GET /api/shops/my/shops - Get user's shops
 * Requires authentication
 */
router.get('/my/shops', authenticateToken, async (req, res) => {
  try {
    const shops = await Shop.find({ ownerId: req.user.supabaseUserId })
      .select('-__v')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: shops
    });
  } catch (error) {
    console.error('Error fetching user shops:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user shops'
    });
  }
});

module.exports = router;
