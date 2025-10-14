const jwt = require('jsonwebtoken');
const { supabaseClient, supabaseService } = require('../config/supabase');
const User = require('../models/User');

/**
 * Middleware to authenticate requests using Supabase JWT
 * Verifies the token and attaches user data to req.user
 */
const authenticateToken = async (req, res, next) => {
  try {
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('Auth middleware - Token received:', token ? `${token.substring(0, 20)}...` : 'No token');
    console.log('Auth middleware - Headers:', {
      authorization: authHeader ? `${authHeader.substring(0, 30)}...` : 'No auth header',
      userAgent: req.headers['user-agent']
    });

    if (!token) {
      console.log('Auth middleware - No token provided');
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    // Development mode: Allow mock tokens for testing
    if (process.env.NODE_ENV === 'development' && (token === 'mock-token' || token === 'mock-token-for-testing')) {
      console.log('Using mock authentication for development');
      // Get a real user from the database for testing
      const User = require('../models/User');
      const testUser = await User.findOne({ email: 'buyer@mail.mcgill.ca' });
      if (testUser) {
        req.user = testUser;
        console.log('Using real user for mock auth:', testUser.email);
      } else {
        req.user = {
          _id: '507f1f77bcf86cd799439011', // Valid ObjectId
          email: 'test@example.com',
          name: 'Test User',
          role: 'customer',
          supabaseUserId: 'mock-supabase-user-id'
        };
      }
      return next();
    }

    // Verify JWT token with Supabase using the anon client
    console.log('Auth middleware - Verifying token with Supabase...');
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);

    if (error) {
      console.error('Supabase token verification error:', {
        message: error.message,
        status: error.status,
        code: error.code,
        tokenPrefix: token.substring(0, 20) + '...'
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        details: error?.message || 'Token verification failed'
      });
    }

    if (!user) {
      console.error('Auth middleware - No user returned from Supabase');
      return res.status(401).json({
        success: false,
        error: 'Invalid token - no user found',
        details: 'Token verification returned no user data'
      });
    }

    console.log('Auth middleware - Token verified successfully for user:', user.email);

    // Get or create user in our database
    let dbUser = await User.findOne({ supabaseUserId: user.id });
    
    if (!dbUser) {
      console.log('Creating new user in MongoDB:', user.email, 'Supabase ID:', user.id);
      // Create user if they don't exist - ALWAYS as customer
      dbUser = new User({
        supabaseUserId: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: 'customer' // ALWAYS default to customer role
      });
      await dbUser.save();
      console.log('User created successfully in MongoDB as customer:', dbUser._id, 'Type:', typeof dbUser._id);
    } else {
      console.log('User found in MongoDB:', dbUser.email, 'Role:', dbUser.role, 'ID:', dbUser._id, 'Type:', typeof dbUser._id);
    }

    // Attach user to request
    req.user = dbUser;
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Middleware to check if user has required role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Middleware to check if user owns a shop
 */
const requireShopOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const shopId = req.params.shopId || req.body.shopId;
    
    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID required'
      });
    }

    // Check if user owns the shop
    const Shop = require('../models/Shop');
    const shop = await Shop.findOne({ _id: shopId, ownerId: req.user._id });

    if (!shop) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Shop not found or not owned by user'
      });
    }

    req.shop = shop;
    next();

  } catch (error) {
    console.error('Shop ownership check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Shop ownership verification failed'
    });
  }
};

/**
 * Helper function to check if user owns a shop
 */
const getUserShop = async (userId) => {
  try {
    const Shop = require('../models/Shop');
    return await Shop.findOne({ ownerId: userId, isActive: true });
  } catch (error) {
    console.error('Error getting user shop:', error);
    return null;
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireShopOwnership,
  getUserShop
};
