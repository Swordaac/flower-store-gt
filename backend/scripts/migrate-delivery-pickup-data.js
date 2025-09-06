const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const PickupLocation = require('../models/PickupLocation');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flower-store');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration function
const migrateDeliveryPickupData = async () => {
  try {
    console.log('Starting delivery/pickup data migration...');
    
    // 1. Create default pickup locations for existing shops
    const shops = await Shop.find({});
    console.log(`Found ${shops.length} shops to process`);
    
    for (const shop of shops) {
      // Check if shop already has pickup locations
      if (shop.pickupLocations && shop.pickupLocations.length > 0) {
        console.log(`Shop ${shop.name} already has pickup locations, skipping...`);
        continue;
      }
      
      // Create a default pickup location for the shop
      const defaultPickupLocation = new PickupLocation({
        name: `${shop.name} - Main Location`,
        shopId: shop._id,
        address: {
          street: shop.address.street,
          city: shop.address.city,
          province: shop.address.state || 'Ontario', // Map state to province
          postalCode: shop.address.postal,
          country: shop.address.country || 'Canada'
        },
        location: {
          type: 'Point',
          coordinates: shop.location.coordinates
        },
        phone: shop.phone,
        email: shop.email,
        businessHours: shop.businessHours || {
          monday: { open: '09:00', close: '18:00', isOpen: true },
          tuesday: { open: '09:00', close: '18:00', isOpen: true },
          wednesday: { open: '09:00', close: '18:00', isOpen: true },
          thursday: { open: '09:00', close: '18:00', isOpen: true },
          friday: { open: '09:00', close: '18:00', isOpen: true },
          saturday: { open: '09:00', close: '17:00', isOpen: true },
          sunday: { open: '10:00', close: '16:00', isOpen: false }
        },
        settings: {
          minNoticeHours: 2,
          maxAdvanceDays: 30,
          timeSlotInterval: 30,
          isActive: true
        },
        description: `Main pickup location for ${shop.name}`,
        pickupInstructions: 'Please bring a valid ID and order confirmation when picking up your order.'
      });
      
      await defaultPickupLocation.save();
      console.log(`Created default pickup location for shop: ${shop.name}`);
      
      // Update shop with pickup location reference
      shop.pickupLocations = [defaultPickupLocation._id];
      await shop.save();
    }
    
    // 2. Update existing orders with new delivery structure
    const orders = await Order.find({});
    console.log(`Found ${orders.length} orders to migrate`);
    
    let updatedOrders = 0;
    
    for (const order of orders) {
      const needsUpdate = !order.delivery.contactPhone || !order.delivery.contactEmail;
      
      if (needsUpdate) {
        // Get the shop for this order
        const shop = await Shop.findById(order.shopId);
        if (!shop) {
          console.log(`Shop not found for order ${order.orderNumber}, skipping...`);
          continue;
        }
        
        // Get the first pickup location for this shop
        const pickupLocation = await PickupLocation.findOne({ shopId: order.shopId });
        
        // Update delivery information
        const updatedDelivery = {
          ...order.delivery.toObject(),
          // Map old field names to new ones
          address: {
            street: order.delivery.address?.street || '',
            city: order.delivery.address?.city || '',
            province: order.delivery.address?.state || 'Ontario',
            postalCode: order.delivery.address?.postal || '',
            country: order.delivery.address?.country || 'Canada'
          },
          // Add required contact information (use placeholder if not available)
          contactPhone: order.delivery.contactPhone || 'Not provided',
          contactEmail: order.delivery.contactEmail || 'Not provided',
          // Add pickup location reference if it's a pickup order
          pickupLocationId: order.delivery.method === 'pickup' && pickupLocation ? pickupLocation._id : undefined,
          // Map special instructions
          specialInstructions: order.delivery.instructions || order.notes || ''
        };
        
        order.delivery = updatedDelivery;
        await order.save();
        updatedOrders++;
      }
    }
    
    console.log(`Migration completed successfully!`);
    console.log(`- Created pickup locations for ${shops.length} shops`);
    console.log(`- Updated ${updatedOrders} orders with new delivery structure`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Run migration
const runMigration = async () => {
  try {
    await connectDB();
    await migrateDeliveryPickupData();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { migrateDeliveryPickupData };
