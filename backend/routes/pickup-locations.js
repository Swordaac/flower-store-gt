const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const PickupLocation = require('../models/PickupLocation');
const Shop = require('../models/Shop');

/**
 * GET /api/pickup-locations - Get pickup locations
 * Public endpoint for customers to see available pickup locations
 */
router.get('/', async (req, res) => {
  try {
    const { shopId, city, isActive = true } = req.query;
    
    let filter = { 'settings.isActive': isActive === 'true' };
    
    if (shopId) {
      filter.shopId = shopId;
    }
    
    if (city) {
      filter['address.city'] = new RegExp(city, 'i');
    }
    
    const pickupLocations = await PickupLocation.find(filter)
      .populate('shopId', 'name address.city address.state')
      .select('-__v')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: pickupLocations
    });
  } catch (error) {
    console.error('Error fetching pickup locations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pickup locations'
    });
  }
});

/**
 * GET /api/pickup-locations/:id - Get single pickup location
 */
router.get('/:id', async (req, res) => {
  try {
    const pickupLocation = await PickupLocation.findById(req.params.id)
      .populate('shopId', 'name address.city address.state phone email')
      .select('-__v');
    
    if (!pickupLocation) {
      return res.status(404).json({
        success: false,
        error: 'Pickup location not found'
      });
    }
    
    res.json({
      success: true,
      data: pickupLocation
    });
  } catch (error) {
    console.error('Error fetching pickup location:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid pickup location ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pickup location'
    });
  }
});

/**
 * GET /api/pickup-locations/:id/time-slots - Get available time slots for a date
 */
router.get('/:id/time-slots', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date parameter is required'
      });
    }
    
    const pickupLocation = await PickupLocation.findById(req.params.id);
    
    if (!pickupLocation) {
      return res.status(404).json({
        success: false,
        error: 'Pickup location not found'
      });
    }
    
    const timeSlots = pickupLocation.getAvailableTimeSlots(new Date(date));
    
    res.json({
      success: true,
      data: {
        pickupLocationId: pickupLocation._id,
        date: date,
        timeSlots: timeSlots
      }
    });
  } catch (error) {
    console.error('Error fetching time slots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch time slots'
    });
  }
});

/**
 * GET /api/pickup-locations/:id/availability - Check pickup location availability
 */
router.get('/:id/availability', async (req, res) => {
  try {
    const pickupLocation = await PickupLocation.findById(req.params.id);
    
    if (!pickupLocation) {
      return res.status(404).json({
        success: false,
        error: 'Pickup location not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        isActive: pickupLocation.settings.isActive,
        isOpenNow: pickupLocation.isOpenNow,
        businessHours: pickupLocation.businessHours,
        nextAvailableTime: pickupLocation.nextAvailableTime
      }
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check availability'
    });
  }
});

/**
 * POST /api/pickup-locations - Create new pickup location
 * Requires shop ownership or admin role
 */
router.post('/', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    const {
      name,
      shopId,
      address,
      location,
      phone,
      email,
      businessHours,
      settings,
      description,
      pickupInstructions
    } = req.body;
    
    // Validate required fields
    if (!name || !shopId || !address || !location) {
      return res.status(400).json({
        success: false,
        error: 'Name, shop ID, address, and location are required'
      });
    }
    
    // Check if user owns the shop (for shop owners)
    if (req.user.role === 'shop_owner') {
      const shop = await Shop.findOne({ _id: shopId, ownerId: req.user._id });
      if (!shop) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You can only create pickup locations for your own shops'
        });
      }
    }
    
    // Create pickup location
    const pickupLocation = new PickupLocation({
      name,
      shopId,
      address,
      location,
      phone,
      email,
      businessHours: businessHours || {
        monday: { open: '09:00', close: '18:00', isOpen: true },
        tuesday: { open: '09:00', close: '18:00', isOpen: true },
        wednesday: { open: '09:00', close: '18:00', isOpen: true },
        thursday: { open: '09:00', close: '18:00', isOpen: true },
        friday: { open: '09:00', close: '18:00', isOpen: true },
        saturday: { open: '09:00', close: '17:00', isOpen: true },
        sunday: { open: '10:00', close: '16:00', isOpen: false }
      },
      settings: settings || {
        minNoticeHours: 2,
        maxAdvanceDays: 30,
        timeSlotInterval: 30,
        isActive: true
      },
      description,
      pickupInstructions
    });
    
    const savedPickupLocation = await pickupLocation.save();
    
    // Update shop with new pickup location
    await Shop.findByIdAndUpdate(shopId, {
      $addToSet: { pickupLocations: savedPickupLocation._id }
    });
    
    res.status(201).json({
      success: true,
      message: 'Pickup location created successfully',
      data: savedPickupLocation
    });
  } catch (error) {
    console.error('Error creating pickup location:', error);
    
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
      error: 'Failed to create pickup location'
    });
  }
});

/**
 * PUT /api/pickup-locations/:id - Update pickup location
 * Requires shop ownership or admin role
 */
router.put('/:id', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    const pickupLocation = await PickupLocation.findById(req.params.id);
    
    if (!pickupLocation) {
      return res.status(404).json({
        success: false,
        error: 'Pickup location not found'
      });
    }
    
    // Check access permissions
    if (req.user.role === 'shop_owner') {
      const shop = await Shop.findOne({ _id: pickupLocation.shopId, ownerId: req.user._id });
      if (!shop) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You can only update pickup locations for your own shops'
        });
      }
    }
    
    const updatedPickupLocation = await PickupLocation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-__v');
    
    res.json({
      success: true,
      message: 'Pickup location updated successfully',
      data: updatedPickupLocation
    });
  } catch (error) {
    console.error('Error updating pickup location:', error);
    
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
      error: 'Failed to update pickup location'
    });
  }
});

/**
 * DELETE /api/pickup-locations/:id - Delete pickup location
 * Requires shop ownership or admin role
 */
router.delete('/:id', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    const pickupLocation = await PickupLocation.findById(req.params.id);
    
    if (!pickupLocation) {
      return res.status(404).json({
        success: false,
        error: 'Pickup location not found'
      });
    }
    
    // Check access permissions
    if (req.user.role === 'shop_owner') {
      const shop = await Shop.findOne({ _id: pickupLocation.shopId, ownerId: req.user._id });
      if (!shop) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You can only delete pickup locations for your own shops'
        });
      }
    }
    
    // Remove pickup location from shop
    await Shop.findByIdAndUpdate(pickupLocation.shopId, {
      $pull: { pickupLocations: pickupLocation._id }
    });
    
    // Delete pickup location
    await PickupLocation.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Pickup location deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pickup location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete pickup location'
    });
  }
});

module.exports = router;
