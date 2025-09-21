const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole, requireShopOwnership } = require('../middleware/auth');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const ProductType = require('../models/ProductType');
const Occasion = require('../models/Occasion');

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
      productTypes,
      occasions,
      color,
      tags, 
      minPrice, 
      maxPrice, 
      inStock, 
      search,
      bestSeller,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build filter
    let filter = { isActive: true };
    
    if (shopId) filter.shopId = shopId;
    
    // Handle new productTypes filter
    if (productTypes) {
      // Handle both array format and comma-separated string
      const productTypeArray = Array.isArray(productTypes) 
        ? productTypes 
        : typeof productTypes === 'string'
          ? productTypes.split(',')
          : [productTypes];
      filter.productTypes = { $in: productTypeArray };
    }
    
    // Handle occasions filter
    if (occasions) {
      // Handle both array format and comma-separated string
      const occasionArray = Array.isArray(occasions)
        ? occasions
        : typeof occasions === 'string'
          ? occasions.split(',')
          : [occasions];
      filter.occasions = { $in: occasionArray };
    }
    
    if (color) {
      const colorArray = Array.isArray(color) ? color : [color];
      filter.color = { $in: colorArray };
    }
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }
    
    // Price filtering - check both variants and legacy prices
    console.log('🔍 Main products - Price filtering debug:', { minPrice, maxPrice, filterBefore: filter });
    if (minPrice || maxPrice) {
      const priceConditions = [];
      
      // Convert input prices from dollars to cents
      const minPriceCents = minPrice ? parseInt(minPrice) * 100 : null;
      const maxPriceCents = maxPrice ? parseInt(maxPrice) * 100 : null;
      
      if (minPriceCents !== null || maxPriceCents !== null) {
        // Variants: require a single variant to satisfy both bounds (if provided)
        const elemMatch = { isActive: true };
        if (minPriceCents !== null) elemMatch.price = { $gte: minPriceCents };
        if (maxPriceCents !== null) elemMatch.price = { ...(elemMatch.price || {}), $lte: maxPriceCents };
        priceConditions.push({ variants: { $elemMatch: elemMatch } });
        
        // Legacy prices fallback
        const legacyAnd = [];
        if (minPriceCents !== null) legacyAnd.push({ 'price.standard': { $gte: minPriceCents } });
        if (maxPriceCents !== null) legacyAnd.push({ 'price.premium': { $lte: maxPriceCents } });
        if (legacyAnd.length > 0) priceConditions.push({ $and: legacyAnd });
      }
      
      if (priceConditions.length > 0) {
        filter.$or = priceConditions;
        console.log('🔍 Applied price filters:', priceConditions);
      }
    }
    console.log('🔍 Main products - Final filter:', filter);
    
    // Stock filtering - check variants only
    if (inStock !== undefined) {
      if (inStock === 'true') {
        filter.variants = { $elemMatch: { isActive: true, stock: { $gt: 0 } } };
      } else {
        filter.$or = [
          { variants: { $not: { $elemMatch: { isActive: true, stock: { $gt: 0 } } } } },
          { variants: { $exists: false } },
          { variants: { $size: 0 } }
        ];
      }
    }
    
    if (search) {
      // Use text search
      filter.$text = { $search: search };
    }
    
    // Best seller filtering
    if (bestSeller !== undefined) {
      filter.isBestSeller = bestSeller === 'true';
    }
    
    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const products = await Product.find(filter)
      .populate('shopId', 'name address.city address.state')
      .populate('productTypes', 'name slug color icon')
      .populate('occasions', 'name slug color icon isSeasonal')
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
 * GET /api/products/types - Get all product types (public)
 */
router.get('/types', async (req, res) => {
  try {
    const productTypes = await ProductType.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select('-__v');
    
    res.json({
      success: true,
      data: productTypes
    });
  } catch (error) {
    console.error('Error fetching product types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product types'
    });
  }
});

/**
 * GET /api/products/occasions - Get all occasions (public)
 */
router.get('/occasions', async (req, res) => {
  try {
    const occasions = await Occasion.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select('-__v');
    
    res.json({
      success: true,
      data: occasions
    });
  } catch (error) {
    console.error('Error fetching occasions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch occasions'
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
      .populate('productTypes', 'name slug color icon')
      .populate('occasions', 'name slug color icon isSeasonal')
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
    console.log('Creating product with data:', JSON.stringify(req.body, null, 2));
    
    const {
      name,
      color,
      description,
      price,
      productTypes,
      occasions,
      variants,
      tags,
      images,
      deluxeImage,
      premiumImage,
      metadata,
      sortOrder
    } = req.body;

    console.log('Extracted fields:');
    console.log('- name:', name);
    console.log('- color:', color);
    console.log('- description:', description);
    console.log('- price:', price);
    console.log('- productTypes:', productTypes);
    console.log('- occasions:', occasions);
    console.log('- variants:', variants);
    console.log('- tags:', tags);
    console.log('- images:', images);
    console.log('- deluxeImage:', deluxeImage);
    console.log('- premiumImage:', premiumImage);
    
    // Validate required fields
    if (!name || !color || !description) {
      return res.status(400).json({
        success: false,
        error: 'Name, color, and description are required'
      });
    }
    
    // Validate productTypes (new required field)
    if (!productTypes || !Array.isArray(productTypes) || productTypes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one product type is required'
      });
    }
    
    // Validate productTypes exist
    const existingProductTypes = await ProductType.find({ 
      _id: { $in: productTypes }, 
      isActive: true 
    });
    if (existingProductTypes.length !== productTypes.length) {
      return res.status(400).json({
        success: false,
        error: 'One or more product types are invalid or inactive'
      });
    }
    
    // Validate occasions if provided
    if (occasions && occasions.length > 0) {
      const existingOccasions = await Occasion.find({ 
        _id: { $in: occasions }, 
        isActive: true 
      });
      if (existingOccasions.length !== occasions.length) {
        return res.status(400).json({
          success: false,
          error: 'One or more occasions are invalid or inactive'
        });
      }
    }
    
    // Handle variants vs legacy price structure
    let productVariants = [];
    let legacyPrice = {};
    
    if (variants && variants.length > 0) {
      // Use new variant structure
      productVariants = variants.map(variant => ({
        tierName: variant.tierName,
        price: parseInt(variant.price),
        stock: parseInt(variant.stock) || 0,
        images: variant.images || [],
        isActive: variant.isActive !== false
      }));
    } else if (price) {
      // Use legacy price structure - convert to variants
      productVariants = [
        {
          tierName: 'standard',
          price: parseInt(price.standard),
          stock: parseInt(stock) || 0,
          images: images || [],
          isActive: true
        },
        {
          tierName: 'deluxe',
          price: parseInt(price.deluxe),
          stock: parseInt(stock) || 0,
          images: deluxeImage ? [deluxeImage] : [],
          isActive: true
        },
        {
          tierName: 'premium',
          price: parseInt(price.premium),
          stock: parseInt(stock) || 0,
          images: premiumImage ? [premiumImage] : [],
          isActive: true
        }
      ];
      
      // Keep legacy fields for backwards compatibility
      legacyPrice = {
        standard: parseInt(price.standard),
        deluxe: parseInt(price.deluxe),
        premium: parseInt(price.premium)
      };
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either variants or price structure is required'
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
    
    const productData = {
      shopId,
      name,
      color,
      description,
      productTypes,
      occasions: occasions || [],
      variants: productVariants,
      // Legacy fields for backwards compatibility
      price: legacyPrice,
      tags,
      images,
      deluxeImage,
      premiumImage,
      metadata,
      sortOrder
    };

    console.log('Creating Product with data:', JSON.stringify(productData, null, 2));
    console.log('Variants:', productVariants);
    console.log('Legacy price values:', legacyPrice);

    const product = new Product(productData);
    
    const savedProduct = await product.save();
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: savedProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', messages);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: messages
      });
    }
    
    // Handle text index array conflict
    if (error.name === 'TextIndexConflict' || (error.message && error.message.includes('Field \'category\' of text index contains an array'))) {
      console.error('Text index conflict detected. This is a database index issue.');
      return res.status(500).json({
        success: false,
        error: 'Database index conflict detected',
        details: 'The database has a text index that conflicts with array fields. Please run the database fix script: node backend/scripts/fix-database-indexes.js',
        fixInstructions: 'Run this command to fix the issue: cd backend && node scripts/fix-database-indexes.js'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create product',
      details: error.message
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
    
    // Validate productTypes if provided
    if (updateData.productTypes) {
      if (!Array.isArray(updateData.productTypes) || updateData.productTypes.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one product type is required'
        });
      }
      
      const existingProductTypes = await ProductType.find({ 
        _id: { $in: updateData.productTypes }, 
        isActive: true 
      });
      if (existingProductTypes.length !== updateData.productTypes.length) {
        return res.status(400).json({
          success: false,
          error: 'One or more product types are invalid or inactive'
        });
      }
    }
    
    // Validate occasions if provided
    if (updateData.occasions) {
      if (updateData.occasions.length > 0) {
        const existingOccasions = await Occasion.find({ 
          _id: { $in: updateData.occasions }, 
          isActive: true 
        });
        if (existingOccasions.length !== updateData.occasions.length) {
          return res.status(400).json({
            success: false,
            error: 'One or more occasions are invalid or inactive'
          });
        }
      }
    }
    
    // Handle variants vs legacy price structure for updates
    if (updateData.variants && updateData.variants.length > 0) {
      // Use new variant structure
      updateData.variants = updateData.variants.map(variant => ({
        tierName: variant.tierName,
        price: parseInt(variant.price),
        stock: parseInt(variant.stock) || 0,
        images: variant.images || [],
        isActive: variant.isActive !== false
      }));
    } else if (updateData.price) {
      // Convert legacy price structure to variants
      updateData.variants = [
        {
          tierName: 'standard',
          price: parseInt(updateData.price.standard),
          stock: parseInt(updateData.stock) || 0,
          images: updateData.images || [],
          isActive: true
        },
        {
          tierName: 'deluxe',
          price: parseInt(updateData.price.deluxe),
          stock: parseInt(updateData.stock) || 0,
          images: updateData.deluxeImage ? [updateData.deluxeImage] : [],
          isActive: true
        },
        {
          tierName: 'premium',
          price: parseInt(updateData.price.premium),
          stock: parseInt(updateData.stock) || 0,
          images: updateData.premiumImage ? [updateData.premiumImage] : [],
          isActive: true
        }
      ];
    }
    
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
 * PATCH /api/products/:id/stock - Update product stock (deprecated - use variants instead)
 * Requires shop ownership or admin role
 */
router.patch('/:id/stock', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    return res.status(410).json({
      success: false,
      error: 'This endpoint is deprecated. Please use the product update endpoint to modify variant stock levels.'
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
    const { 
      page = 1, 
      limit = 20, 
      category, 
      productTypes,
      occasions,
      color, 
      inStock,
      bestSeller,
      minPrice,
      maxPrice
    } = req.query;
    
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
    
    // Handle new productTypes filter
    if (productTypes) {
      // Handle both array format and comma-separated string
      const productTypeArray = Array.isArray(productTypes) 
        ? productTypes 
        : typeof productTypes === 'string'
          ? productTypes.split(',')
          : [productTypes];
      filter.productTypes = { $in: productTypeArray };
    }
    
    // Handle occasions filter
    if (occasions) {
      // Handle both array format and comma-separated string
      const occasionArray = Array.isArray(occasions)
        ? occasions
        : typeof occasions === 'string'
          ? occasions.split(',')
          : [occasions];
      filter.occasions = { $in: occasionArray };
    }
    
    if (color) {
      const colorArray = Array.isArray(color) ? color : [color];
      filter.color = { $in: colorArray };
    }
    
    // Price filtering - check both variants and legacy prices
    console.log('🔍 Shop products - Price filtering debug:', { minPrice, maxPrice, filterBefore: filter });
    if (minPrice || maxPrice) {
      const priceConditions = [];
      
      // Convert input prices from dollars to cents
      const minPriceCents = minPrice ? parseInt(minPrice) * 100 : null;
      const maxPriceCents = maxPrice ? parseInt(maxPrice) * 100 : null;
      
      if (minPriceCents !== null || maxPriceCents !== null) {
        // Filter for variants
        const variantConditions = {
          'variants.isActive': true,
          'variants.stock': { $gt: 0 }
        };
        
        if (minPriceCents !== null) {
          variantConditions['variants.price'] = { $gte: minPriceCents };
        }
        if (maxPriceCents !== null) {
          variantConditions['variants.price'] = {
            ...(variantConditions['variants.price'] || {}),
            $lte: maxPriceCents
          };
        }
        
        priceConditions.push(variantConditions);
        
        // Also check legacy price structure
        const legacyConditions = {};
        if (minPriceCents !== null) {
          legacyConditions['price.standard'] = { $gte: minPriceCents };
        }
        if (maxPriceCents !== null) {
          legacyConditions['price.premium'] = { $lte: maxPriceCents };
        }
        
        priceConditions.push(legacyConditions);
      }
      
      if (priceConditions.length > 0) {
        filter.$or = priceConditions;
        console.log('🔍 Applied price filters:', priceConditions);
      }
    }
    console.log('🔍 Shop products - Final filter:', filter);
    
    // Best seller filtering
    if (bestSeller !== undefined) {
      filter.isBestSeller = bestSeller === 'true';
    }
    
    // Stock filtering - check variants only
    if (inStock !== undefined) {
      if (inStock === 'true') {
        filter['variants.stock'] = { $gt: 0 };
        filter['variants.isActive'] = true;
      } else {
        filter.$or = [
          { 'variants.stock': { $lte: 0 } },
          { 'variants.isActive': false },
          { variants: { $exists: false } },
          { variants: { $size: 0 } }
        ];
      }
    }
    
    const products = await Product.find(filter)
      .populate('productTypes', 'name slug color icon')
      .populate('occasions', 'name slug color icon isSeasonal')
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

/**
 * POST /api/products/types - Create new product type (admin only)
 */
router.post('/types', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, description, color, icon, sortOrder } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Product type name is required'
      });
    }
    
    const productType = new ProductType({
      name,
      description,
      color,
      icon,
      sortOrder
    });
    
    const savedProductType = await productType.save();
    
    res.status(201).json({
      success: true,
      message: 'Product type created successfully',
      data: savedProductType
    });
  } catch (error) {
    console.error('Error creating product type:', error);
    
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
      error: 'Failed to create product type'
    });
  }
});

/**
 * POST /api/products/occasions - Create new occasion (admin only)
 */
router.post('/occasions', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { 
      name, 
      description, 
      color, 
      icon, 
      sortOrder, 
      isSeasonal, 
      seasonalStart, 
      seasonalEnd 
    } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Occasion name is required'
      });
    }
    
    const occasion = new Occasion({
      name,
      description,
      color,
      icon,
      sortOrder,
      isSeasonal: isSeasonal || false,
      seasonalStart,
      seasonalEnd
    });
    
    const savedOccasion = await occasion.save();
    
    res.status(201).json({
      success: true,
      message: 'Occasion created successfully',
      data: savedOccasion
    });
  } catch (error) {
    console.error('Error creating occasion:', error);
    
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
      error: 'Failed to create occasion'
    });
  }
});

module.exports = router;
