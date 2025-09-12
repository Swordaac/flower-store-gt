const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductType = require('../models/ProductType');
const Occasion = require('../models/Occasion');
const Shop = require('../models/Shop');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flower-store');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create sample product types
const createSampleProductTypes = async () => {
  console.log('Creating sample product types...');
  
  const productTypes = [
    { name: 'Bouquets', description: 'Beautiful flower arrangements', color: '#FF6B6B', icon: '🌹', sortOrder: 1 },
    { name: 'Single Flowers', description: 'Individual flower stems', color: '#4ECDC4', icon: '🌷', sortOrder: 2 },
    { name: 'Plants', description: 'Potted plants and greenery', color: '#45B7D1', icon: '🌿', sortOrder: 3 },
    { name: 'Gift Baskets', description: 'Gift arrangements with flowers and treats', color: '#96CEB4', icon: '🎁', sortOrder: 4 },
    { name: 'Wedding', description: 'Wedding flowers and arrangements', color: '#DDA0DD', icon: '💒', sortOrder: 5 }
  ];

  const createdTypes = [];
  for (const typeData of productTypes) {
    let productType = await ProductType.findOne({ name: typeData.name });
    if (!productType) {
      productType = new ProductType(typeData);
      await productType.save();
      console.log(`Created product type: ${typeData.name}`);
    } else {
      console.log(`Product type already exists: ${typeData.name}`);
    }
    createdTypes.push(productType);
  }
  
  return createdTypes;
};

// Create sample occasions
const createSampleOccasions = async () => {
  console.log('Creating sample occasions...');
  
  const occasions = [
    { name: 'Wedding', description: 'Wedding celebrations', color: '#DDA0DD', icon: '💒', sortOrder: 1 },
    { name: 'Birthday', description: 'Birthday celebrations', color: '#BB8FCE', icon: '🎂', sortOrder: 2 },
    { name: 'Anniversary', description: 'Anniversary celebrations', color: '#F7DC6F', icon: '💕', sortOrder: 3 },
    { name: 'Valentine\'s Day', description: 'Valentine\'s Day', color: '#FF6B6B', icon: '💘', isSeasonal: true, sortOrder: 4 },
    { name: 'Sympathy', description: 'Sympathy and condolences', color: '#98D8C8', icon: '🤍', sortOrder: 5 }
  ];

  const createdOccasions = [];
  for (const occasionData of occasions) {
    let occasion = await Occasion.findOne({ name: occasionData.name });
    if (!occasion) {
      occasion = new Occasion(occasionData);
      await occasion.save();
      console.log(`Created occasion: ${occasionData.name}`);
    } else {
      console.log(`Occasion already exists: ${occasionData.name}`);
    }
    createdOccasions.push(occasion);
  }
  
  return createdOccasions;
};

// Create sample products with new schema
const createSampleProducts = async (productTypes, occasions, shopId) => {
  console.log('Creating sample products...');
  
  const sampleProducts = [
    {
      name: 'Classic Red Rose Bouquet',
      color: 'red',
      description: 'A stunning arrangement of 24 red roses, perfect for expressing love and romance.',
      productTypes: [productTypes[0]._id], // Bouquets
      occasions: [occasions[0]._id, occasions[3]._id], // Wedding, Valentine's Day
      variants: [
        {
          tierName: 'standard',
          price: 4500, // $45.00 in cents
          stock: 10,
          images: [
            {
              size: 'medium',
              url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400',
              alt: 'Classic Red Rose Bouquet - Standard',
              isPrimary: true
            }
          ],
          isActive: true
        },
        {
          tierName: 'deluxe',
          price: 6500, // $65.00 in cents
          stock: 8,
          images: [
            {
              size: 'medium',
              url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400',
              alt: 'Classic Red Rose Bouquet - Deluxe',
              isPrimary: true
            }
          ],
          isActive: true
        },
        {
          tierName: 'premium',
          price: 8500, // $85.00 in cents
          stock: 5,
          images: [
            {
              size: 'medium',
              url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400',
              alt: 'Classic Red Rose Bouquet - Premium',
              isPrimary: true
            }
          ],
          isActive: true
        }
      ],
      tags: ['romantic', 'classic', 'roses'],
      isActive: true,
      isFeatured: true
    },
    {
      name: 'Sunflower Sunshine',
      color: 'yellow',
      description: 'Bright and cheerful sunflowers that bring joy to any space.',
      productTypes: [productTypes[0]._id, productTypes[1]._id], // Bouquets, Single Flowers
      occasions: [occasions[1]._id], // Birthday
      variants: [
        {
          tierName: 'standard',
          price: 2500, // $25.00 in cents
          stock: 15,
          images: [
            {
              size: 'medium',
              url: 'https://images.unsplash.com/photo-1597848212624-e19a2c1d2a0a?w=400',
              alt: 'Sunflower Sunshine - Standard',
              isPrimary: true
            }
          ],
          isActive: true
        },
        {
          tierName: 'deluxe',
          price: 3500, // $35.00 in cents
          stock: 12,
          images: [
            {
              size: 'medium',
              url: 'https://images.unsplash.com/photo-1597848212624-e19a2c1d2a0a?w=400',
              alt: 'Sunflower Sunshine - Deluxe',
              isPrimary: true
            }
          ],
          isActive: true
        }
      ],
      tags: ['cheerful', 'bright', 'sunflowers'],
      isActive: true,
      isFeatured: false
    },
    {
      name: 'Elegant White Lilies',
      color: 'white',
      description: 'Pure white lilies symbolizing peace and remembrance.',
      productTypes: [productTypes[0]._id], // Bouquets
      occasions: [occasions[4]._id], // Sympathy
      variants: [
        {
          tierName: 'standard',
          price: 4000, // $40.00 in cents
          stock: 8,
          images: [
            {
              size: 'medium',
              url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
              alt: 'Elegant White Lilies - Standard',
              isPrimary: true
            }
          ],
          isActive: true
        },
        {
          tierName: 'premium',
          price: 6000, // $60.00 in cents
          stock: 6,
          images: [
            {
              size: 'medium',
              url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
              alt: 'Elegant White Lilies - Premium',
              isPrimary: true
            }
          ],
          isActive: true
        }
      ],
      tags: ['elegant', 'peaceful', 'lilies'],
      isActive: true,
      isFeatured: false
    }
  ];

  const createdProducts = [];
  for (const productData of sampleProducts) {
    const product = new Product({
      ...productData,
      shopId
    });
    
    await product.save();
    createdProducts.push(product);
    console.log(`Created product: ${productData.name}`);
  }
  
  return createdProducts;
};

// Main seeding function
const runSeeding = async () => {
  try {
    await connectDB();
    
    console.log('Starting data seeding...');
    
    // Get or create a shop
    let shop = await Shop.findOne({ isActive: true });
    if (!shop) {
      console.log('No active shop found. Please create a shop first.');
      return;
    }
    
    // Step 1: Create product types
    const productTypes = await createSampleProductTypes();
    
    // Step 2: Create occasions
    const occasions = await createSampleOccasions();
    
    // Step 3: Create sample products
    const products = await createSampleProducts(productTypes, occasions, shop._id);
    
    console.log(`Seeding completed successfully! Created ${products.length} products.`);
    
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  runSeeding();
}

module.exports = {
  runSeeding,
  createSampleProductTypes,
  createSampleOccasions,
  createSampleProducts
};
