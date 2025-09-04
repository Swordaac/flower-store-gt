const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { uploadSingle, uploadMultiple, handleUploadError } = require('../middleware/upload');
const { uploadImage, deleteImage, generateSignedUrl, getImageInfo } = require('../config/cloudinary');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

/**
 * POST /api/images/upload/single - Upload single image for a product
 * Requires shop ownership or admin role
 */
router.post('/upload/single', authenticateToken, requireRole(['shop_owner', 'admin']), uploadSingle, handleUploadError, async (req, res) => {
  try {
    const { productId, alt, size = 'medium' } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    // Handle temporary product ID for new products
    let product = null;
    let shop = null;
    
    if (productId === 'temp') {
      // For new products, we need to verify shop ownership through the user's shop
      shop = await Shop.findOne({ ownerId: req.user._id });
      if (!shop) {
        return res.status(404).json({
          success: false,
          error: 'No shop found for user. Please create a shop first.'
        });
      }
    } else {
      // Find the product and verify shop ownership
      product = await Product.findById(productId).populate('shopId');
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      // Check if user owns the shop (unless admin)
      if (req.user.role !== 'admin') {
        shop = await Shop.findOne({ _id: product.shopId._id, ownerId: req.user._id });
        if (!shop) {
          return res.status(403).json({
            success: false,
            error: 'Access denied: You can only upload images for your own products'
          });
        }
      }
    }

    // Create folder path: shops/{shopId}/products/{productId}
    const folder = `shops/${shop._id}/products/${productId}`;
    
    // Upload image to Cloudinary
    const result = await uploadImage(req.file.buffer, folder);
    
    // Create image object
    const imageData = {
      size: size,
      publicId: result.public_id,
      url: result.secure_url,
      alt: alt || (product ? product.name : 'Product image'),
      isPrimary: product ? product.images.length === 0 : true // First image is primary
    };

    // For existing products, add image to product and save
    if (product) {
      product.images.push(imageData);
      await product.save();
    }

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        image: imageData,
        product: product ? {
          _id: product._id,
          name: product.name,
          imageCount: product.images.length
        } : {
          _id: 'temp',
          name: 'New Product',
          imageCount: 1
        }
      }
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    });
  }
});

/**
 * POST /api/images/upload/multiple - Upload multiple images for a product
 * Requires shop ownership or admin role
 */
router.post('/upload/multiple', authenticateToken, requireRole(['shop_owner', 'admin']), uploadMultiple, handleUploadError, async (req, res) => {
  try {
    const { productId, imageSizes } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files provided'
      });
    }

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    // Parse image sizes if provided
    let sizes = [];
    console.log('Received imageSizes:', imageSizes, 'Type:', typeof imageSizes);
    if (imageSizes) {
      try {
        sizes = Array.isArray(imageSizes) ? imageSizes : JSON.parse(imageSizes);
        console.log('Parsed sizes:', sizes);
      } catch (e) {
        console.warn('Invalid imageSizes format, using default sizes:', e.message);
      }
    }

    // Handle temporary product ID for new products
    let product = null;
    let shop = null;
    
    if (productId === 'temp') {
      // For new products, we need to verify shop ownership through the user's shop
      shop = await Shop.findOne({ ownerId: req.user._id });
      if (!shop) {
        return res.status(404).json({
          success: false,
          error: 'No shop found for user. Please create a shop first.'
        });
      }
    } else {
      // Find the product and verify shop ownership
      product = await Product.findById(productId).populate('shopId');
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      // Check if user owns the shop (unless admin)
      if (req.user.role !== 'admin') {
        shop = await Shop.findOne({ _id: product.shopId._id, ownerId: req.user._id });
        if (!shop) {
          return res.status(403).json({
            success: false,
            error: 'Access denied: You can only upload images for your own products'
          });
        }
      }
    }

    // Create folder path: shops/{shopId}/products/{productId}
    const folder = `shops/${shop._id}/products/${productId}`;
    
    // Upload all images to Cloudinary
    const uploadPromises = req.files.map(async (file, index) => {
      const result = await uploadImage(file.buffer, folder);
      return {
        size: sizes[index] || 'medium', // Use provided size or default to medium
        publicId: result.public_id,
        url: result.secure_url,
        alt: product ? `${product.name} - Image ${index + 1}` : `Product image ${index + 1}`,
        isPrimary: (product ? product.images.length === 0 : true) && index === 0 // First image of first batch is primary
      };
    });

    const uploadedImages = await Promise.all(uploadPromises);

    // For existing products, add images to product and save
    if (product) {
      product.images.push(...uploadedImages);
      await product.save();
    }

    res.status(201).json({
      success: true,
      message: `${uploadedImages.length} images uploaded successfully`,
      data: {
        images: uploadedImages,
        product: product ? {
          _id: product._id,
          name: product.name,
          imageCount: product.images.length
        } : {
          _id: 'temp',
          name: 'New Product',
          imageCount: uploadedImages.length
        }
      }
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload images'
    });
  }
});

/**
 * DELETE /api/images/:publicId - Delete an image
 * Requires shop ownership or admin role
 */
router.delete('/:publicId', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    const { publicId } = req.params;

    // Find the product that contains this image
    const product = await Product.findOne({ 'images.publicId': publicId }).populate('shopId');
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    // Check if user owns the shop (unless admin)
    if (req.user.role !== 'admin') {
      const shop = await Shop.findOne({ _id: product.shopId._id, ownerId: req.user._id });
      if (!shop) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You can only delete images from your own products'
        });
      }
    }

    // Delete image from Cloudinary
    await deleteImage(publicId);

    // Remove image from product
    const imageIndex = product.images.findIndex(img => img.publicId === publicId);
    if (imageIndex !== -1) {
      const wasPrimary = product.images[imageIndex].isPrimary;
      product.images.splice(imageIndex, 1);

      // If deleted image was primary, make the first remaining image primary
      if (wasPrimary && product.images.length > 0) {
        product.images[0].isPrimary = true;
      }

      await product.save();
    }

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        product: {
          _id: product._id,
          name: product.name,
          imageCount: product.images.length
        }
      }
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete image'
    });
  }
});

/**
 * PUT /api/images/:publicId/primary - Set an image as primary
 * Requires shop ownership or admin role
 */
router.put('/:publicId/primary', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    const { publicId } = req.params;

    // Find the product that contains this image
    const product = await Product.findOne({ 'images.publicId': publicId }).populate('shopId');
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    // Check if user owns the shop (unless admin)
    if (req.user.role !== 'admin') {
      const shop = await Shop.findOne({ _id: product.shopId._id, ownerId: req.user._id });
      if (!shop) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You can only modify images from your own products'
        });
      }
    }

    // Update primary image
    product.images.forEach(img => {
      img.isPrimary = img.publicId === publicId;
    });

    await product.save();

    res.json({
      success: true,
      message: 'Primary image updated successfully',
      data: {
        product: {
          _id: product._id,
          name: product.name,
          primaryImage: product.images.find(img => img.isPrimary)
        }
      }
    });

  } catch (error) {
    console.error('Error updating primary image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update primary image'
    });
  }
});

/**
 * GET /api/images/product/:productId - Get all images for a product
 * Public endpoint (no authentication required)
 */
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId).select('images name');
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: {
        product: {
          _id: product._id,
          name: product.name,
          images: product.images
        }
      }
    });

  } catch (error) {
    console.error('Error fetching product images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product images'
    });
  }
});

/**
 * GET /api/images/shop/:shopId - Get all images for a shop's products
 * Requires shop ownership or admin role
 */
router.get('/shop/:shopId', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    const { shopId } = req.params;

    // Check if user owns the shop (unless admin)
    if (req.user.role !== 'admin') {
      const shop = await Shop.findOne({ _id: shopId, ownerId: req.user._id });
      if (!shop) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You can only view images from your own shop'
        });
      }
    }

    const products = await Product.find({ shopId }).select('name images');
    
    // Flatten all images with product information
    const allImages = [];
    products.forEach(product => {
      product.images.forEach(image => {
        allImages.push({
          ...image.toObject(),
          productId: product._id,
          productName: product.name
        });
      });
    });

    res.json({
      success: true,
      data: {
        shopId,
        totalImages: allImages.length,
        images: allImages
      }
    });

  } catch (error) {
    console.error('Error fetching shop images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shop images'
    });
  }
});

module.exports = router;
