const express = require('express');
const router = express.Router();
const { calculateDeliveryFee, getAllDeliveryFees, isInDeliveryArea, getDeliveryFeeStats } = require('../utils/deliveryFeeCalculator');

/**
 * POST /api/delivery/calculate-fee - Calculate delivery fee for a postal code
 * Public endpoint - no authentication required
 */
router.post('/calculate-fee', async (req, res) => {
  try {
    const { postalCode } = req.body;
    
    if (!postalCode) {
      return res.status(400).json({
        success: false,
        error: 'Postal code is required'
      });
    }
    
    const result = calculateDeliveryFee(postalCode);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          postalCode: result.postalCode,
          fee: result.fee,
          matchType: result.matchType,
          matchedPrefix: result.matchedPrefix
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
        data: {
          postalCode: result.postalCode,
          fee: null
        }
      });
    }
  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate delivery fee'
    });
  }
});

/**
 * GET /api/delivery/check-area/:postalCode - Check if postal code is in delivery area
 * Public endpoint - no authentication required
 */
router.get('/check-area/:postalCode', async (req, res) => {
  try {
    const { postalCode } = req.params;
    
    if (!postalCode) {
      return res.status(400).json({
        success: false,
        error: 'Postal code is required'
      });
    }
    
    const inArea = isInDeliveryArea(postalCode);
    const feeResult = calculateDeliveryFee(postalCode);
    
    res.json({
      success: true,
      data: {
        postalCode: feeResult.postalCode,
        inDeliveryArea: inArea,
        fee: inArea ? feeResult.fee : null,
        matchType: inArea ? feeResult.matchType : null
      }
    });
  } catch (error) {
    console.error('Error checking delivery area:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check delivery area'
    });
  }
});

/**
 * GET /api/delivery/fees - Get all delivery fees (for reference)
 * Public endpoint - no authentication required
 */
router.get('/fees', async (req, res) => {
  try {
    const fees = getAllDeliveryFees();
    
    res.json({
      success: true,
      data: {
        fees,
        count: Object.keys(fees).length
      }
    });
  } catch (error) {
    console.error('Error fetching delivery fees:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery fees'
    });
  }
});

/**
 * GET /api/delivery/stats - Get delivery fee statistics
 * Public endpoint - no authentication required
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = getDeliveryFeeStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching delivery fee stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery fee statistics'
    });
  }
});

/**
 * GET /api/delivery/search/:prefix - Search postal codes by prefix
 * Public endpoint - no authentication required
 */
router.get('/search/:prefix', async (req, res) => {
  try {
    const { prefix } = req.params;
    
    if (!prefix || prefix.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Prefix must be at least 2 characters long'
      });
    }
    
    const normalizedPrefix = prefix.toUpperCase();
    const allFees = getAllDeliveryFees();
    
    // Find exact matches first, then partial matches
    const exactMatches = Object.keys(allFees).filter(key => 
      key === normalizedPrefix
    );
    
    const partialMatches = Object.keys(allFees).filter(key => 
      key.startsWith(normalizedPrefix) && key !== normalizedPrefix
    );
    
    const results = [...exactMatches, ...partialMatches].map(key => ({
      postalCode: key,
      fee: allFees[key]
    }));
    
    res.json({
      success: true,
      data: {
        prefix: normalizedPrefix,
        results,
        count: results.length
      }
    });
  } catch (error) {
    console.error('Error searching postal codes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search postal codes'
    });
  }
});

module.exports = router;
