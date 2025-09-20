const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductType = require('../models/ProductType');
const Occasion = require('../models/Occasion');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB Atlas
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/flower-store';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Mapping rules for legacy categories to new product types
const categoryToProductTypeMapping = {
  'bouquet': 'Rose Only',
  'bouquets': 'Rose Only',
  'rose': 'Rose Only',
  'roses': 'Rose Only',
  'orchid': 'Orchid',
  'orchids': 'Orchid',
  'plant': 'Indoor Plant',
  'plants': 'Indoor Plant',
  'indoor': 'Indoor Plant',
  'indoor plant': 'Indoor Plant',
  'indoor plants': 'Indoor Plant'
};

// Mapping rules for legacy categories to new occasions
const categoryToOccasionMapping = {
  'birthday': 'Birthday',
  'anniversary': 'Anniversary',
  'wedding': 'Wedding',
  'sympathy': 'Sympathy',
  'funeral': 'Sympathy',
  'congratulation': 'Congratulation',
  'congratulations': 'Congratulation',
  'get well': 'Get Well Soon',
  'get well soon': 'Get Well Soon',
  'baby': 'New Baby',
  'new baby': 'New Baby'
};

async function mapExistingData() {
  try {
    console.log('🔄 Mapping existing data to new structure...\n');

    // Get all new product types and occasions
    const productTypes = await ProductType.find({});
    const occasions = await Occasion.find({});

    console.log(`📋 Found ${productTypes.length} product types and ${occasions.length} occasions`);

    // Get all products that need mapping
    const products = await Product.find({
      $or: [
        { category: { $exists: true, $ne: [] } },
        { productTypes: { $exists: false } },
        { occasions: { $exists: false } }
      ]
    });

    console.log(`📦 Found ${products.length} products that need mapping\n`);

    let mappedCount = 0;

    for (const product of products) {
      const updates = {};
      let hasUpdates = false;

      // Map legacy categories to product types
      if (product.category && product.category.length > 0) {
        const mappedProductTypes = [];
        
        for (const category of product.category) {
          const lowerCategory = category.toLowerCase();
          
          // Find matching product type
          for (const [key, value] of Object.entries(categoryToProductTypeMapping)) {
            if (lowerCategory.includes(key)) {
              const productType = productTypes.find(pt => pt.name === value);
              if (productType && !mappedProductTypes.find(pt => pt._id.toString() === productType._id.toString())) {
                mappedProductTypes.push(productType._id);
              }
            }
          }
        }

        if (mappedProductTypes.length > 0) {
          updates.productTypes = mappedProductTypes;
          hasUpdates = true;
          console.log(`   📦 ${product.name}: Mapped categories to product types`);
        }
      }

      // Map legacy categories to occasions
      if (product.category && product.category.length > 0) {
        const mappedOccasions = [];
        
        for (const category of product.category) {
          const lowerCategory = category.toLowerCase();
          
          // Find matching occasion
          for (const [key, value] of Object.entries(categoryToOccasionMapping)) {
            if (lowerCategory.includes(key)) {
              const occasion = occasions.find(o => o.name === value);
              if (occasion && !mappedOccasions.find(o => o._id.toString() === occasion._id.toString())) {
                mappedOccasions.push(occasion._id);
              }
            }
          }
        }

        if (mappedOccasions.length > 0) {
          updates.occasions = mappedOccasions;
          hasUpdates = true;
          console.log(`   🎉 ${product.name}: Mapped categories to occasions`);
        }
      }

      // Ensure productTypes field exists
      if (!product.productTypes || product.productTypes.length === 0) {
        // Assign a default product type if none found
        const defaultProductType = productTypes.find(pt => pt.name === 'Rose Only');
        if (defaultProductType) {
          updates.productTypes = [defaultProductType._id];
          hasUpdates = true;
          console.log(`   🏷️  ${product.name}: Assigned default product type`);
        }
      }

      // Ensure occasions field exists
      if (!product.occasions || product.occasions.length === 0) {
        updates.occasions = [];
        hasUpdates = true;
      }

      // Ensure isBestSeller field exists
      if (product.isBestSeller === undefined) {
        updates.isBestSeller = false;
        hasUpdates = true;
      }

      // Apply updates
      if (hasUpdates) {
        await Product.findByIdAndUpdate(product._id, updates);
        mappedCount++;
      }
    }

    console.log(`\n✅ Mapping completed! Updated ${mappedCount} products`);

    // Show final statistics
    const finalStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          withProductTypes: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$productTypes', []] } }, 0] }, 1, 0] } },
          withOccasions: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$occasions', []] } }, 0] }, 1, 0] } },
          bestSellers: { $sum: { $cond: ['$isBestSeller', 1, 0] } }
        }
      }
    ]);

    if (finalStats.length > 0) {
      const stats = finalStats[0];
      console.log('\n📊 Final Statistics:');
      console.log(`   Total products: ${stats.totalProducts}`);
      console.log(`   With product types: ${stats.withProductTypes}`);
      console.log(`   With occasions: ${stats.withOccasions}`);
      console.log(`   Best sellers: ${stats.bestSellers}`);
    }

  } catch (error) {
    console.error('❌ Mapping failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await mapExistingData();
  } catch (error) {
    console.error('💥 Mapping process failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run mapping
main();
