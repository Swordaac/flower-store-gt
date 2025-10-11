const mongoose = require('mongoose');
const ProductType = require('../models/ProductType');
const Product = require('../models/Product');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/flower-store';
    console.log('Connecting to MongoDB...');
    console.log('URI:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in log
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// New product types to migrate to
const newProductTypes = [
  {
    name: 'Rose',
    description: 'Beautiful rose arrangements',
    color: '#F44336',
    icon: '🌹',
    sortOrder: 1
  },
  {
    name: 'Bouquet',
    description: 'Classic flower bouquets',
    color: '#E91E63',
    icon: '💐',
    sortOrder: 2
  },
  {
    name: 'Bouquet in Vase',
    description: 'Flower bouquets arranged in decorative vases',
    color: '#9C27B0',
    icon: '🏺',
    sortOrder: 3
  },
  {
    name: 'Indoor Plants',
    description: 'Indoor plants and greenery',
    color: '#4CAF50',
    icon: '🌱',
    sortOrder: 4
  },
  {
    name: 'Orchid',
    description: 'Elegant orchid arrangements',
    color: '#FF9800',
    icon: '🌸',
    sortOrder: 5
  },
  {
    name: 'Fruit Basket',
    description: 'Fruit baskets and arrangements',
    color: '#FF5722',
    icon: '🍎',
    sortOrder: 6
  },
  {
    name: 'Flowers Box',
    description: 'Flower arrangements in decorative boxes',
    color: '#795548',
    icon: '📦',
    sortOrder: 7
  }
];

// Function to migrate product types
const migrateProductTypes = async () => {
  try {
    console.log('\n🔄 Starting product type migration...');
    
    // Get all existing product types
    const existingTypes = await ProductType.find({});
    console.log(`Found ${existingTypes.length} existing product types`);
    
    // Get all products that reference product types
    const productsWithTypes = await Product.find({ productTypes: { $exists: true, $ne: [] } });
    console.log(`Found ${productsWithTypes.length} products with product type references`);
    
    // Create a mapping of old product type IDs to new ones
    const typeMapping = new Map();
    
    // First, create all new product types
    console.log('\n📝 Creating new product types...');
    for (const typeData of newProductTypes) {
      const existingType = await ProductType.findOne({ name: typeData.name });
      if (existingType) {
        console.log(`✅ Product type "${typeData.name}" already exists`);
        typeMapping.set(typeData.name, existingType._id);
      } else {
        const newType = new ProductType(typeData);
        await newType.save();
        console.log(`✅ Created product type: "${typeData.name}"`);
        typeMapping.set(typeData.name, newType._id);
      }
    }
    
    // Update products to use new product types
    console.log('\n🔄 Updating products with new product types...');
    let updatedProducts = 0;
    let skippedProducts = 0;
    
    for (const product of productsWithTypes) {
      try {
        const newProductTypes = [];
        
        // Map old product types to new ones based on name similarity
        for (const oldTypeId of product.productTypes) {
          const oldType = existingTypes.find(t => t._id.toString() === oldTypeId.toString());
          if (oldType) {
            // Try to find a matching new type based on name similarity
            let mappedTypeId = null;
            
            // Direct name matches
            if (oldType.name.toLowerCase().includes('rose')) {
              mappedTypeId = typeMapping.get('Rose');
            } else if (oldType.name.toLowerCase().includes('bouquet')) {
              mappedTypeId = typeMapping.get('Bouquet');
            } else if (oldType.name.toLowerCase().includes('vase')) {
              mappedTypeId = typeMapping.get('Bouquet in Vase');
            } else if (oldType.name.toLowerCase().includes('plant')) {
              mappedTypeId = typeMapping.get('Indoor Plants');
            } else if (oldType.name.toLowerCase().includes('orchid')) {
              mappedTypeId = typeMapping.get('Orchid');
            } else if (oldType.name.toLowerCase().includes('fruit') || oldType.name.toLowerCase().includes('basket')) {
              mappedTypeId = typeMapping.get('Fruit Basket');
            } else if (oldType.name.toLowerCase().includes('box')) {
              mappedTypeId = typeMapping.get('Flowers Box');
            }
            
            // If no specific match found, default to "Bouquet"
            if (!mappedTypeId) {
              mappedTypeId = typeMapping.get('Bouquet');
              console.log(`⚠️  Mapped "${oldType.name}" to "Bouquet" (default)`);
            }
            
            if (mappedTypeId && !newProductTypes.includes(mappedTypeId)) {
              newProductTypes.push(mappedTypeId);
            }
          }
        }
        
        // If no product types were mapped, assign to "Bouquet" as default
        if (newProductTypes.length === 0) {
          newProductTypes.push(typeMapping.get('Bouquet'));
          console.log(`⚠️  Product "${product.name}" assigned to "Bouquet" (default)`);
        }
        
        // Clean up invalid variant images before saving
        if (product.variants && Array.isArray(product.variants)) {
          product.variants.forEach(variant => {
            if (variant.images && Array.isArray(variant.images)) {
              // Filter out invalid images (missing size or url)
              variant.images = variant.images.filter(img => 
                img && img.size && img.url && img.size.trim() !== '' && img.url.trim() !== ''
              );
            }
          });
        }
        
        // Update the product
        product.productTypes = newProductTypes;
        await product.save();
        updatedProducts++;
        
      } catch (error) {
        console.log(`⚠️  Skipped product "${product.name}" due to validation error: ${error.message}`);
        skippedProducts++;
      }
    }
    
    console.log(`✅ Updated ${updatedProducts} products with new product types`);
    if (skippedProducts > 0) {
      console.log(`⚠️  Skipped ${skippedProducts} products due to validation errors`);
    }
    
    // Remove old product types that are not in the new list
    console.log('\n🗑️  Removing old product types...');
    const newTypeNames = newProductTypes.map(t => t.name);
    const typesToRemove = existingTypes.filter(t => !newTypeNames.includes(t.name));
    
    if (typesToRemove.length > 0) {
      const removeIds = typesToRemove.map(t => t._id);
      await ProductType.deleteMany({ _id: { $in: removeIds } });
      console.log(`✅ Removed ${typesToRemove.length} old product types:`);
      typesToRemove.forEach(t => console.log(`   - ${t.name}`));
    } else {
      console.log('✅ No old product types to remove');
    }
    
    // Display final product types
    console.log('\n📋 Final product types:');
    const finalTypes = await ProductType.find({}).sort({ sortOrder: 1 });
    finalTypes.forEach(type => {
      console.log(`   ${type.sortOrder}. ${type.name} (${type.color}) ${type.icon || ''}`);
    });
    
    console.log('\n✅ Product type migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await migrateProductTypes();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the migration
if (require.main === module) {
  main();
}

module.exports = { migrateProductTypes, newProductTypes };
