const mongoose = require('mongoose');
require('dotenv').config();

// Import the Shop model
const Shop = require('../models/Shop');

async function createDefaultShop() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/flower-store');
    console.log('Connected to MongoDB');

    // Check if default shop already exists
    const existingShop = await Shop.findOne({ name: 'Default Flower Shop' });
    if (existingShop) {
      console.log('Default shop already exists:', existingShop._id);
      return existingShop._id;
    }

    // Create default shop
    const defaultShop = new Shop({
      name: 'Default Flower Shop',
      description: 'A beautiful flower shop for testing',
      address: {
        street: '123 Flower Street',
        city: 'Toronto',
        state: 'ON',
        postal: 'M5V 3A8',
        country: 'Canada'
      },
      phone: '(555) 123-4567',
      email: 'info@defaultflowershop.com',
      ownerId: 'default-owner-id', // You might want to use a real user ID
      isActive: true,
      location: {
        type: 'Point',
        coordinates: [-79.3832, 43.6532] // Toronto coordinates
      },
      currency: 'CAD',
      deliveryOptions: {
        delivery: true,
        pickup: true,
        deliveryFee: 1000, // $10.00 in cents
        freeDeliveryThreshold: 5000 // $50.00 in cents
      },
      taxRate: 0.13, // 13% tax rate
      businessHours: {
        monday: { open: '09:00', close: '18:00', isOpen: true },
        tuesday: { open: '09:00', close: '18:00', isOpen: true },
        wednesday: { open: '09:00', close: '18:00', isOpen: true },
        thursday: { open: '09:00', close: '18:00', isOpen: true },
        friday: { open: '09:00', close: '18:00', isOpen: true },
        saturday: { open: '09:00', close: '17:00', isOpen: true },
        sunday: { open: '10:00', close: '16:00', isOpen: true }
      }
    });

    const savedShop = await defaultShop.save();
    console.log('Default shop created successfully:', savedShop._id);
    console.log('Shop name:', savedShop.name);
    
    return savedShop._id;
  } catch (error) {
    console.error('Error creating default shop:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
createDefaultShop();
