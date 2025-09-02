const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole, requireShopOwnership } = require('../middleware/auth');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

/**
 * GET /api/products - Get all products with filtering (public)
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      shopId, 
      category, 
      tags, 
      minPrice, 
      maxPrice, 
      inStock, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build filter
    let filter = { isActive: true };
    
    if (shopId) filter.shopId = shopId;
    if (category) filter.category = category;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }
    if (inStock !== undefined) {
      filter.quantity = inStock === 'true' ? { $gt: 0 } : { $lte: 0 };
    }
    if (search) {
      filter.$text = { $search: search };
    }
    
    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const products = await Product.find(filter)
      .populate('shopId', 'name address.city address.state')
      .select('-__v')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Product.countDocuments(filter);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

/**
 * GET /api/products/:id - Get single product by ID (public)
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('shopId', 'name address.city address.state isActive')
      .select('-__v');
    
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Check if shop is active
    if (!product.shopId || !product.shopId.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Product not available'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
});

/**
 * POST /api/products - Create new product
 * Requires shop ownership or admin role
 */
router.post('/', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      quantity,
      category,
      tags,
      images,
      metadata,
      sortOrder
    } = req.body;
    
    // Validate required fields
    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        error: 'Name, price, and category are required'
      });
    }
    
    // Check if user owns a shop (unless admin)
    let shopId = req.body.shopId;
    if (req.user.role !== 'admin') {
      const shop = await Shop.findOne({ ownerId: req.user._id, isActive: true });
      if (!shop) {
        return res.status(400).json({
          success: false,
          error: 'You must own an active shop to create products'
        });
      }
      shopId = shop._id;
    }
    
    // Validate shop exists and is active
    if (shopId) {
      const shop = await Shop.findById(shopId);
      if (!shop || !shop.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or inactive shop'
        });
      }
    }
    
    const product = new Product({
      shopId,
      name,
      description,
      price: parseInt(price), // Price is already in cents from frontend
      quantity,
      category,
      tags,
      images,
      metadata,
      sortOrder
    });
    
    const savedProduct = await product.save();
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: savedProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
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
      error: 'Failed to create product'
    });
  }
});

/**
 * PUT /api/products/:id - Update product
 * Requires shop ownership or admin role
 */
router.put('/:id', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Check ownership (unless admin)
    if (req.user.role !== 'admin') {
      const product = await Product.findById(productId).populate('shopId');
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }
      
      // Check if the user owns the shop that owns this product
      if (!product.shopId || product.shopId.ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Product not owned by user'
        });
      }
    }
    
    const updateData = { ...req.body };
    
    // Price is already in cents from frontend, no conversion needed
    
    // Prevent changing shop ownership
    delete updateData.shopId;
    
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    
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
      error: 'Failed to update product'
    });
  }
});

/**
 * DELETE /api/products/:id - Deactivate product
 * Requires shop ownership or admin role
 */
router.delete('/:id', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Check ownership (unless admin)
    if (req.user.role !== 'admin') {
      const product = await Product.findById(productId).populate('shopId');
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }
      
      // Check if the user owns the shop that owns this product
      if (!product.shopId || product.shopId.ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Product not owned by user'
        });
      }
    }
    
    const product = await Product.findByIdAndUpdate(
      productId,
      { isActive: false },
      { new: true }
    ).select('-__v');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deactivated successfully',
      data: product
    });
  } catch (error) {
    console.error('Error deactivating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate product'
    });
  }
});

/**
 * PATCH /api/products/:id/stock - Update product stock
 * Requires shop ownership or admin role
 */
router.patch('/:id/stock', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.id;
    
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid quantity is required'
      });
    }
    
    // Check ownership (unless admin)
    if (req.user.role !== 'admin') {
      const product = await Product.findById(productId).populate('shopId');
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }
      
      // Check if the user owns the shop that owns this product
      if (!product.shopId || product.shopId.ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Product not owned by user'
        });
      }
    }
    
    const product = await Product.findByIdAndUpdate(
      productId,
      { quantity },
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update stock'
    });
  }
});

/**
 * GET /api/products/shop/:shopId - Get products by shop (public)
 */
router.get('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { page = 1, limit = 20, category, inStock } = req.query;
    
    // Verify shop exists and is active
    const shop = await Shop.findById(shopId);
    if (!shop || !shop.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found or inactive'
      });
    }
    
    // Build filter
    let filter = { shopId, isActive: true };
    if (category) filter.category = category;
    if (inStock !== undefined) {
      filter.quantity = inStock === 'true' ? { $gt: 0 } : { $lte: 0 };
    }
    
    const products = await Product.find(filter)
      .select('-__v')
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Product.countDocuments(filter);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching shop products:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shop products'
    });
  }
});

module.exports = router;
