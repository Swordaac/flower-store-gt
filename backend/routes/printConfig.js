const express = require('express');
const router = express.Router();
const enhancedPrintService = require('../services/enhancedPrintService');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * @route   GET /api/print-config/printers
 * @desc    Get available printers with tray information
 * @access  Private (Admin/Staff)
 */
router.get('/printers', authenticateToken, requireRole(['admin', 'shop_owner']), async (req, res) => {
  try {
    const printers = await enhancedPrintService.getPrintersWithTrays();
    
    res.json({
      success: true,
      data: printers,
      message: `Found ${printers.length} printers with tray information`
    });
  } catch (error) {
    console.error('Error fetching printers with trays:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch printers with tray information'
    });
  }
});

/**
 * @route   GET /api/print-config/layouts
 * @desc    Get available print layouts
 * @access  Private (Admin/Staff)
 */
router.get('/layouts', authenticateToken, requireRole(['admin', 'shop_owner']), async (req, res) => {
  try {
    const layouts = {
      deliveryInstructions: {
        name: 'Delivery Instructions',
        description: 'Standard layout for delivery instructions',
        paperSize: 'A4',
        orientation: 'portrait',
        defaultTray: 'default'
      },
      cardMessage: {
        name: 'Card Message',
        description: 'Compact layout for card messages',
        paperSize: 'A6',
        orientation: 'portrait',
        defaultTray: 'cardstock'
      },
      orderSummary: {
        name: 'Order Summary',
        description: 'Detailed layout for order summaries',
        paperSize: 'A4',
        orientation: 'portrait',
        defaultTray: 'default'
      }
    };

    res.json({
      success: true,
      data: layouts,
      message: 'Print layouts retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching print layouts:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch print layouts'
    });
  }
});

/**
 * @route   POST /api/print-config/test-print
 * @desc    Test print with specific configuration
 * @access  Private (Admin/Staff)
 */
router.post('/test-print', authenticateToken, requireRole(['admin', 'shop_owner']), async (req, res) => {
  try {
    const {
      printType = 'deliveryInstructions',
      printerId = null,
      trayId = 'default',
      layout = null,
      testData = null
    } = req.body;

    // Create test order data if not provided
    const testOrder = testData || {
      orderNumber: 'TEST-001',
      createdAt: new Date(),
      recipient: {
        name: 'Test Recipient',
        phone: '+1234567890',
        email: 'test@example.com'
      },
      delivery: {
        method: 'delivery',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          province: 'QC',
          postalCode: 'H1A 1A1',
          country: 'Canada'
        },
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        time: '14:00',
        instructions: 'Please leave at front door',
        specialInstructions: 'Handle with care - fragile items',
        buzzerCode: '1234'
      },
      cardMessage: 'Happy Birthday! Hope you have a wonderful day.',
      occasion: 'Birthday',
      items: [
        {
          name: 'Test Bouquet',
          quantity: 1,
          price: 5000, // $50.00 in cents
          total: 5000
        }
      ],
      subtotal: 5000,
      taxAmount: 750, // 15% tax
      deliveryFee: 500,
      total: 6250
    };

    const result = await enhancedPrintService.printWithTray({
      order: testOrder,
      printType,
      printerId,
      trayId,
      layout
    });

    res.json({
      success: result.success,
      data: result,
      message: result.success ? 'Test print job submitted successfully' : 'Test print job failed'
    });
  } catch (error) {
    console.error('Error testing print:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to test print configuration'
    });
  }
});

/**
 * @route   POST /api/print-config/print-order
 * @desc    Print order with custom configuration
 * @access  Private (Admin/Staff)
 */
router.post('/print-order', authenticateToken, requireRole(['admin', 'shop_owner']), async (req, res) => {
  try {
    const {
      orderId,
      printConfig = {}
    } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required',
        message: 'Please provide a valid order ID'
      });
    }

    // Import Order model
    const Order = require('../models/Order');
    
    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        message: 'The specified order does not exist'
      });
    }

    const result = await enhancedPrintService.printAllOrderDocuments(order, printConfig);

    res.json({
      success: result.success,
      data: result,
      message: result.success ? 'Order documents printed successfully' : 'Some order documents failed to print'
    });
  } catch (error) {
    console.error('Error printing order:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to print order documents'
    });
  }
});

/**
 * @route   GET /api/print-config/status
 * @desc    Get print service status and statistics
 * @access  Private (Admin/Staff)
 */
router.get('/status', authenticateToken, requireRole(['admin', 'shop_owner']), async (req, res) => {
  try {
    const connectionTest = await enhancedPrintService.testConnection();
    const printers = await enhancedPrintService.getPrintersWithTrays();
    
    const status = {
      connection: connectionTest,
      printers: {
        total: printers.length,
        withMultipleTrays: printers.filter(p => p.hasMultipleTrays).length,
        list: printers.map(p => ({
          id: p.id,
          name: p.name,
          state: p.state,
          hasMultipleTrays: p.hasMultipleTrays,
          trayCount: p.trays.length
        }))
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: status,
      message: 'Print service status retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting print status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get print service status'
    });
  }
});

/**
 * @route   POST /api/print-config/custom-layout
 * @desc    Create or update custom print layout
 * @access  Private (Admin/Staff)
 */
router.post('/custom-layout', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      layoutName,
      layoutType, // 'deliveryInstructions', 'cardMessage', 'orderSummary'
      configuration
    } = req.body;

    if (!layoutName || !layoutType || !configuration) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Layout name, type, and configuration are required'
      });
    }

    // Validate layout type
    const validTypes = ['deliveryInstructions', 'cardMessage', 'orderSummary'];
    if (!validTypes.includes(layoutType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid layout type',
        message: `Layout type must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate configuration structure
    const requiredFields = ['paperSize', 'orientation', 'margins', 'fontSizes', 'colors'];
    const missingFields = requiredFields.filter(field => !configuration[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration',
        message: `Missing required configuration fields: ${missingFields.join(', ')}`
      });
    }

    // Here you would typically save the custom layout to a database
    // For now, we'll just return success
    res.json({
      success: true,
      data: {
        layoutName,
        layoutType,
        configuration,
        createdAt: new Date().toISOString()
      },
      message: 'Custom layout created successfully'
    });
  } catch (error) {
    console.error('Error creating custom layout:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create custom layout'
    });
  }
});

module.exports = router;
