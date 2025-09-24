const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const Contact = require('../models/Contact');
const Shop = require('../models/Shop');

/**
 * POST /api/contact - Submit a contact form (public)
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message, shopId } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message || !shopId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }

    // Verify shop exists and is active
    const shop = await Shop.findById(shopId);
    if (!shop || !shop.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found or inactive'
      });
    }

    const contact = new Contact({
      name,
      email,
      phone,
      subject,
      message,
      shopId,
      status: 'new'
    });

    const savedContact = await contact.save();

    res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully',
      data: savedContact
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit contact form'
    });
  }
});

/**
 * GET /api/contact - Get all contact submissions (shop owner & admin only)
 */
router.get('/', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    
    // Build filter
    let filter = {};
    
    // If shop owner, only show their shop's messages
    if (req.user.role === 'shop_owner') {
      const shop = await Shop.findOne({ ownerId: req.user._id });
      if (!shop) {
        return res.status(404).json({
          success: false,
          error: 'Shop not found'
        });
      }
      filter.shopId = shop._id;
    }
    
    // Add status filter if provided
    if (status) {
      filter.status = status;
    }

    const contacts = await Contact.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('shopId', 'name')
      .populate('readBy', 'email');

    const total = await Contact.countDocuments(filter);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact submissions'
    });
  }
});

/**
 * PATCH /api/contact/:id/status - Update contact status (shop owner & admin only)
 */
router.patch('/:id/status', authenticateToken, requireRole(['shop_owner', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    // Find contact and verify ownership if shop owner
    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    if (req.user.role === 'shop_owner') {
      const shop = await Shop.findOne({ ownerId: req.user._id });
      if (!shop || shop._id.toString() !== contact.shopId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this contact'
        });
      }
    }

    // Update status and related fields
    const updates = {
      status,
      readBy: req.user._id
    };

    if (status === 'read' && contact.status === 'new') {
      updates.readAt = new Date();
    } else if (status === 'replied') {
      updates.repliedAt = new Date();
    }

    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    ).populate('shopId', 'name').populate('readBy', 'email');

    res.json({
      success: true,
      data: updatedContact
    });
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update contact status'
    });
  }
});

module.exports = router;
