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
 * GET /api/shops/my/shops - Get user's shops
 * Requires authentication
 */
router.get('/my/shops', authenticateToken, async (req, res) => {
  try {
    const shops = await Shop.find({ ownerId: req.user._id })
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

/**
 * GET /api/shops/my-shop - Get current user's shop (Shop owners only)
 */
router.get('/my-shop', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    const shop = await Shop.findOne({ ownerId: req.user._id, isActive: true });
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'No active shop found for this user'
      });
    }
    
    res.json({
      success: true,
      data: shop
    });
  } catch (error) {
    console.error('Error fetching user shop:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shop information'
    });
  }
});

/**
 * GET /api/shops/admin/all - Get all shops (Admin only)
 */
router.get('/admin/all', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 50, includeInactive = false } = req.query;
    
    // Build filter
    let filter = {};
    if (includeInactive !== 'true') {
      filter.isActive = true;
    }
    
    const shops = await Shop.find(filter)
      .select('-__v')
      .populate('ownerId', 'name email role')
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
    console.error('Error fetching all shops:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shops'
    });
  }
});

/**
 * GET /api/shops/admin/shop-owners - Get all shop owners (Admin only)
 */
router.get('/admin/shop-owners', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const User = require('../models/User');
    
    // Get all shop owners with their shop information
    const shopOwners = await User.find({ role: { $in: ['shop_owner', 'admin'] } })
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Get shop information for each shop owner
    const shopOwnersWithShops = await Promise.all(
      shopOwners.map(async (owner) => {
        const shop = await Shop.findOne({ ownerId: owner._id, isActive: true })
          .select('name isActive createdAt');
        
        return {
          ...owner.toObject(),
          shop: shop || null
        };
      })
    );
    
    const total = await User.countDocuments({ role: { $in: ['shop_owner', 'admin'] } });
    
    res.json({
      success: true,
      data: shopOwnersWithShops,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching shop owners:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shop owners'
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
 * POST /api/shops - Create new shop (Admin only)
 * Only admins can create shops for users
 */
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
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
      businessHours,
      ownerId // Required: the user ID who will own this shop
    } = req.body;
    
    // Validate required fields
    if (!name || !ownerId || !address) {
      return res.status(400).json({
        success: false,
        error: 'Name, owner ID, and address are required'
      });
    }
    
    // Check if the owner user exists
    const User = require('../models/User');
    const ownerUser = await User.findById(ownerId);
    if (!ownerUser) {
      return res.status(400).json({
        success: false,
        error: 'Owner user not found'
      });
    }
    
    // Check if user already owns a shop
    const existingShop = await Shop.findOne({ ownerId });
    if (existingShop) {
      return res.status(400).json({
        success: false,
        error: 'User already owns a shop'
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
      ownerId
    });
    
    const savedShop = await shop.save();
    
    // Update the user's role to shop_owner ONLY if they were a customer
    if (ownerUser.role === 'customer') {
      await User.findByIdAndUpdate(ownerId, { role: 'shop_owner' });
    }
    
    res.status(201).json({
      success: true,
      message: ownerUser.role === 'customer' 
        ? 'Shop created successfully and user role updated to shop_owner'
        : 'Shop created successfully',
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
 * POST /api/shops/create-for-user - Create shop for current user (Admin only)
 * Allows admins to create shops for themselves or other users
 */
router.post('/create-for-user', authenticateToken, requireRole(['admin']), async (req, res) => {
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
      businessHours,
      targetUserId // Optional: if not provided, creates for the admin user
    } = req.body;
    
    const ownerId = targetUserId || req.user._id;
    
    // Validate required fields
    if (!name || !address) {
      return res.status(400).json({
        success: false,
        error: 'Name and address are required'
      });
    }
    
    // Check if the owner user exists
    const User = require('../models/User');
    const ownerUser = await User.findById(ownerId);
    if (!ownerUser) {
      return res.status(400).json({
        success: false,
        error: 'Owner user not found'
      });
    }
    
    // Check if user already owns a shop
    const existingShop = await Shop.findOne({ ownerId });
    if (existingShop) {
      return res.status(400).json({
        success: false,
        error: 'User already owns a shop'
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
      ownerId
    });
    
    const savedShop = await shop.save();
    
    // Update the user's role to shop_owner ONLY if they were a customer
    if (ownerUser.role === 'customer') {
      await User.findByIdAndUpdate(ownerId, { role: 'shop_owner' });
    }
    
    res.status(201).json({
      success: true,
      message: ownerUser.role === 'customer'
        ? 'Shop created successfully and user role updated to shop_owner'
        : 'Shop created successfully',
      data: savedShop
    });
  } catch (error) {
    console.error('Error creating shop for user:', error);
    
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
      error: 'Failed to create shop for user'
    });
  }
});

/**
 * POST /api/shops/admin/create-by-email - Create shop for user by email (Admin only)
 * Allows admins to create shops by providing user email instead of user ID
 */
router.post('/admin/create-by-email', authenticateToken, requireRole(['admin']), async (req, res) => {
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
      businessHours,
      userEmail // Required: the email of the user who will own this shop
    } = req.body;
    
    // Validate required fields
    if (!name || !userEmail || !address) {
      return res.status(400).json({
        success: false,
        error: 'Name, user email, and address are required'
      });
    }
    
    // Find the user by email
    const User = require('../models/User');
    const ownerUser = await User.findOne({ email: userEmail });
    if (!ownerUser) {
      return res.status(400).json({
        success: false,
        error: 'User with the provided email not found'
      });
    }
    
    // Check if user already owns a shop
    const existingShop = await Shop.findOne({ ownerId: ownerUser._id });
    if (existingShop) {
      return res.status(400).json({
        success: false,
        error: 'User already owns a shop'
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
      ownerId: ownerUser._id
    });
    
    const savedShop = await shop.save();
    
    // Update the user's role to shop_owner ONLY if they were a customer
    if (ownerUser.role === 'customer') {
      await User.findByIdAndUpdate(ownerUser._id, { role: 'shop_owner' });
    }
    
    res.status(201).json({
      success: true,
      message: ownerUser.role === 'customer' 
        ? 'Shop created successfully and user role updated to shop_owner'
        : 'Shop created successfully',
      data: savedShop
    });
  } catch (error) {
    console.error('Error creating shop by email:', error);
    
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
      error: 'Failed to create shop by email'
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
      const shop = await Shop.findOne({ _id: shopId, ownerId: req.user._id });
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
      const shop = await Shop.findOne({ _id: shopId, ownerId: req.user._id });
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

module.exports = router;
