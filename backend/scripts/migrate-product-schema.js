const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductType = require('../models/ProductType');
const Occasion = require('../models/Occasion');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/flower-store');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create default product types based on existing categories
const createDefaultProductTypes = async () => {
  console.log('Creating default product types...');
  
  const defaultProductTypes = [
    { name: 'Bouquets', description: 'Beautiful flower arrangements', color: '#FF6B6B', sortOrder: 1 },
    { name: 'Single Flowers', description: 'Individual flower stems', color: '#4ECDC4', sortOrder: 2 },
    { name: 'Plants', description: 'Potted plants and greenery', color: '#45B7D1', sortOrder: 3 },
    { name: 'Gift Baskets', description: 'Gift arrangements with flowers and treats', color: '#96CEB4', sortOrder: 4 },
    { name: 'Seasonal', description: 'Seasonal flower arrangements', color: '#FFEAA7', sortOrder: 5 },
    { name: 'Wedding', description: 'Wedding flowers and arrangements', color: '#DDA0DD', sortOrder: 6 },
    { name: 'Funeral', description: 'Sympathy and funeral arrangements', color: '#98D8C8', sortOrder: 7 },
    { name: 'Anniversary', description: 'Anniversary flower arrangements', color: '#F7DC6F', sortOrder: 8 },
    { name: 'Birthday', description: 'Birthday flower arrangements', color: '#BB8FCE', sortOrder: 9 },
    { name: 'Other', description: 'Other flower arrangements', color: '#85C1E9', sortOrder: 10 }
  ];

  for (const productTypeData of defaultProductTypes) {
    const existingType = await ProductType.findOne({ name: productTypeData.name });
    if (!existingType) {
      const productType = new ProductType(productTypeData);
      await productType.save();
      console.log(`Created product type: ${productTypeData.name}`);
    } else {
      console.log(`Product type already exists: ${productTypeData.name}`);
    }
  }
};

// Create default occasions
const createDefaultOccasions = async () => {
  console.log('Creating default occasions...');
  
  const defaultOccasions = [
    { name: 'Wedding', description: 'Wedding celebrations', color: '#DDA0DD', sortOrder: 1 },
    { name: 'Birthday', description: 'Birthday celebrations', color: '#BB8FCE', sortOrder: 2 },
    { name: 'Anniversary', description: 'Anniversary celebrations', color: '#F7DC6F', sortOrder: 3 },
    { name: 'Valentine\'s Day', description: 'Valentine\'s Day', color: '#FF6B6B', isSeasonal: true, sortOrder: 4 },
    { name: 'Mother\'s Day', description: 'Mother\'s Day', color: '#FFB6C1', isSeasonal: true, sortOrder: 5 },
    { name: 'Christmas', description: 'Christmas celebrations', color: '#90EE90', isSeasonal: true, sortOrder: 6 },
    { name: 'Sympathy', description: 'Sympathy and condolences', color: '#98D8C8', sortOrder: 7 },
    { name: 'Congratulations', description: 'Congratulations and celebrations', color: '#87CEEB', sortOrder: 8 },
    { name: 'Get Well', description: 'Get well wishes', color: '#98FB98', sortOrder: 9 },
    { name: 'Thank You', description: 'Thank you gifts', color: '#F0E68C', sortOrder: 10 }
  ];

  for (const occasionData of defaultOccasions) {
    const existingOccasion = await Occasion.findOne({ name: occasionData.name });
    if (!existingOccasion) {
      const occasion = new Occasion(occasionData);
      await occasion.save();
      console.log(`Created occasion: ${occasionData.name}`);
    } else {
      console.log(`Occasion already exists: ${occasionData.name}`);
    }
  }
};

// Map legacy categories to product types
const mapCategoryToProductType = async (category) => {
  const categoryMap = {
    'bouquet': 'Bouquets',
    'single-flower': 'Single Flowers',
    'plant': 'Plants',
    'gift-basket': 'Gift Baskets',
    'seasonal': 'Seasonal',
    'wedding': 'Wedding',
    'funeral': 'Funeral',
    'anniversary': 'Anniversary',
    'birthday': 'Birthday',
    'other': 'Other'
  };
  
  const productTypeName = categoryMap[category] || 'Other';
  const productType = await ProductType.findOne({ name: productTypeName });
  return productType ? productType._id : null;
};

// Migrate existing products to new schema
const migrateProducts = async () => {
  console.log('Starting product migration...');
  
  const products = await Product.find({});
  console.log(`Found ${products.length} products to migrate`);
  
  let migratedCount = 0;
  let errorCount = 0;
  
  for (const product of products) {
    try {
      const updateData = {};
      
      // Convert legacy categories to productTypes
      if (product.category && product.category.length > 0) {
        const productTypeIds = [];
        for (const category of product.category) {
          const productTypeId = await mapCategoryToProductType(category);
          if (productTypeId && !productTypeIds.includes(productTypeId.toString())) {
            productTypeIds.push(productTypeId);
          }
        }
        if (productTypeIds.length > 0) {
          updateData.productTypes = productTypeIds;
        }
      }
      
      // Convert legacy price structure to variants
      if (product.price && (product.price.standard || product.price.deluxe || product.price.premium)) {
        const variants = [];
        
        if (product.price.standard !== undefined) {
          variants.push({
            tierName: 'standard',
            price: product.price.standard,
            stock: product.stock || 0,
            images: product.images || [],
            isActive: true
          });
        }
        
        if (product.price.deluxe !== undefined) {
          variants.push({
            tierName: 'deluxe',
            price: product.price.deluxe,
            stock: product.stock || 0,
            images: product.deluxeImage ? [product.deluxeImage] : [],
            isActive: true
          });
        }
        
        if (product.price.premium !== undefined) {
          variants.push({
            tierName: 'premium',
            price: product.price.premium,
            stock: product.stock || 0,
            images: product.premiumImage ? [product.premiumImage] : [],
            isActive: true
          });
        }
        
        if (variants.length > 0) {
          updateData.variants = variants;
        }
      }
      
      // Only update if we have changes
      if (Object.keys(updateData).length > 0) {
        await Product.findByIdAndUpdate(product._id, updateData);
        migratedCount++;
        console.log(`Migrated product: ${product.name} (${product._id})`);
      } else {
        console.log(`No migration needed for product: ${product.name} (${product._id})`);
      }
      
    } catch (error) {
      console.error(`Error migrating product ${product.name} (${product._id}):`, error.message);
      errorCount++;
    }
  }
  
  console.log(`Migration completed. Migrated: ${migratedCount}, Errors: ${errorCount}`);
};

// Main migration function
const runMigration = async () => {
  try {
    await connectDB();
    
    console.log('Starting product schema migration...');
    
    // Step 1: Create default product types
    await createDefaultProductTypes();
    
    // Step 2: Create default occasions
    await createDefaultOccasions();
    
    // Step 3: Migrate existing products
    await migrateProducts();
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = {
  runMigration,
  createDefaultProductTypes,
  createDefaultOccasions,
  migrateProducts
};
