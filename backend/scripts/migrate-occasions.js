const mongoose = require('mongoose');
const Occasion = require('../models/Occasion');
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

// New occasions to migrate to
const newOccasions = [
  {
    name: 'Birthday',
    description: 'Celebrate special birthdays',
    color: '#FF9800',
    sortOrder: 1
  },
  {
    name: 'Anniversary',
    description: 'Celebrate special anniversaries',
    color: '#E91E63',
    sortOrder: 2
  },
  {
    name: 'Love & Romantic',
    description: 'Express love and romance',
    color: '#F44336',
    sortOrder: 3
  },
  {
    name: 'Get Well Soon',
    description: 'Wish someone a speedy recovery',
    color: '#9C27B0',
    sortOrder: 4
  },
  {
    name: 'Wedding',
    description: 'Wedding flowers and arrangements',
    color: '#FFC107',
    sortOrder: 5
  },
  {
    name: 'Prom',
    description: 'Prom and formal event flowers',
    color: '#00BCD4',
    sortOrder: 6
  },
  {
    name: 'Congratulations',
    description: 'Celebrate achievements and milestones',
    color: '#4CAF50',
    sortOrder: 7
  },
  {
    name: 'New Baby',
    description: 'Welcome new additions to the family',
    color: '#00BCD4',
    sortOrder: 8
  },
  {
    name: 'Grand Opening',
    description: 'Celebrate business grand openings',
    color: '#795548',
    sortOrder: 9
  },
  {
    name: 'Wreaths',
    description: 'Funeral wreaths and arrangements',
    color: '#607D8B',
    sortOrder: 10,
    sympathy: ['Wreaths', 'Casket Sprays', 'Sympathy Bouquets']
  },
  {
    name: 'Casket Sprays',
    description: 'Casket spray arrangements',
    color: '#607D8B',
    sortOrder: 11,
    sympathy: ['Wreaths', 'Casket Sprays', 'Sympathy Bouquets']
  },
  {
    name: 'Sympathy Bouquets',
    description: 'Sympathy and condolence arrangements',
    color: '#607D8B',
    sortOrder: 12,
    sympathy: ['Wreaths', 'Casket Sprays', 'Sympathy Bouquets']
  }
];

// Function to migrate occasions
const migrateOccasions = async () => {
  try {
    console.log('\n🔄 Starting occasion migration...');
    
    // Get all existing occasions
    const existingOccasions = await Occasion.find({});
    console.log(`Found ${existingOccasions.length} existing occasions`);
    
    // Get all products that reference occasions
    const productsWithOccasions = await Product.find({ occasions: { $exists: true, $ne: [] } });
    console.log(`Found ${productsWithOccasions.length} products with occasion references`);
    
    // Create a mapping of old occasion IDs to new ones
    const occasionMapping = new Map();
    
    // First, create all new occasions
    console.log('\n📝 Creating new occasions...');
    for (const occasionData of newOccasions) {
      const existingOccasion = await Occasion.findOne({ name: occasionData.name });
      if (existingOccasion) {
        console.log(`✅ Occasion "${occasionData.name}" already exists`);
        occasionMapping.set(occasionData.name, existingOccasion._id);
      } else {
        const newOccasion = new Occasion(occasionData);
        await newOccasion.save();
        console.log(`✅ Created occasion: "${occasionData.name}"`);
        occasionMapping.set(occasionData.name, newOccasion._id);
      }
    }
    
    // Update products to use new occasions
    console.log('\n🔄 Updating products with new occasions...');
    let updatedProducts = 0;
    let skippedProducts = 0;
    
    for (const product of productsWithOccasions) {
      try {
        const newOccasions = [];
        
        // Map old occasions to new ones based on name similarity
        for (const oldOccasionId of product.occasions) {
          const oldOccasion = existingOccasions.find(o => o._id.toString() === oldOccasionId.toString());
          if (oldOccasion) {
            // Try to find a matching new occasion based on name similarity
            let mappedOccasionId = null;
            
            // Direct name matches
            if (oldOccasion.name.toLowerCase().includes('birthday')) {
              mappedOccasionId = occasionMapping.get('Birthday');
            } else if (oldOccasion.name.toLowerCase().includes('anniversary')) {
              mappedOccasionId = occasionMapping.get('Anniversary');
            } else if (oldOccasion.name.toLowerCase().includes('love') || oldOccasion.name.toLowerCase().includes('romantic')) {
              mappedOccasionId = occasionMapping.get('Love & Romantic');
            } else if (oldOccasion.name.toLowerCase().includes('get well') || oldOccasion.name.toLowerCase().includes('recovery')) {
              mappedOccasionId = occasionMapping.get('Get Well Soon');
            } else if (oldOccasion.name.toLowerCase().includes('wedding')) {
              mappedOccasionId = occasionMapping.get('Wedding');
            } else if (oldOccasion.name.toLowerCase().includes('prom')) {
              mappedOccasionId = occasionMapping.get('Prom');
            } else if (oldOccasion.name.toLowerCase().includes('congratulation')) {
              mappedOccasionId = occasionMapping.get('Congratulations');
            } else if (oldOccasion.name.toLowerCase().includes('baby') || oldOccasion.name.toLowerCase().includes('new baby')) {
              mappedOccasionId = occasionMapping.get('New Baby');
            } else if (oldOccasion.name.toLowerCase().includes('grand opening') || oldOccasion.name.toLowerCase().includes('opening')) {
              mappedOccasionId = occasionMapping.get('Grand Opening');
            } else if (oldOccasion.name.toLowerCase().includes('wreath')) {
              mappedOccasionId = occasionMapping.get('Wreaths');
            } else if (oldOccasion.name.toLowerCase().includes('casket')) {
              mappedOccasionId = occasionMapping.get('Casket Sprays');
            } else if (oldOccasion.name.toLowerCase().includes('sympathy') || oldOccasion.name.toLowerCase().includes('funeral')) {
              mappedOccasionId = occasionMapping.get('Sympathy Bouquets');
            }
            
            // If no specific match found, default to "Congratulations"
            if (!mappedOccasionId) {
              mappedOccasionId = occasionMapping.get('Congratulations');
              console.log(`⚠️  Mapped "${oldOccasion.name}" to "Congratulations" (default)`);
            }
            
            if (mappedOccasionId && !newOccasions.includes(mappedOccasionId)) {
              newOccasions.push(mappedOccasionId);
            }
          }
        }
        
        // If no occasions were mapped, assign to "Congratulations" as default
        if (newOccasions.length === 0) {
          newOccasions.push(occasionMapping.get('Congratulations'));
          console.log(`⚠️  Product "${product.name}" assigned to "Congratulations" (default)`);
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
        product.occasions = newOccasions;
        await product.save();
        updatedProducts++;
        
      } catch (error) {
        console.log(`⚠️  Skipped product "${product.name}" due to validation error: ${error.message}`);
        skippedProducts++;
      }
    }
    
    console.log(`✅ Updated ${updatedProducts} products with new occasions`);
    if (skippedProducts > 0) {
      console.log(`⚠️  Skipped ${skippedProducts} products due to validation errors`);
    }
    
    // Remove old occasions that are not in the new list
    console.log('\n🗑️  Removing old occasions...');
    const newOccasionNames = newOccasions.map(o => o.name);
    const occasionsToRemove = existingOccasions.filter(o => !newOccasionNames.includes(o.name));
    
    if (occasionsToRemove.length > 0) {
      const removeIds = occasionsToRemove.map(o => o._id);
      await Occasion.deleteMany({ _id: { $in: removeIds } });
      console.log(`✅ Removed ${occasionsToRemove.length} old occasions:`);
      occasionsToRemove.forEach(o => console.log(`   - ${o.name}`));
    } else {
      console.log('✅ No old occasions to remove');
    }
    
    // Display final occasions
    console.log('\n📋 Final occasions:');
    const finalOccasions = await Occasion.find({}).sort({ sortOrder: 1 });
    finalOccasions.forEach(occasion => {
      console.log(`   ${occasion.sortOrder}. ${occasion.name} (${occasion.color})`);
      if (occasion.sympathy && occasion.sympathy.length > 0) {
        console.log(`      Sympathy categories: ${occasion.sympathy.join(', ')}`);
      }
    });
    
    console.log('\n✅ Occasion migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await migrateOccasions();
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

module.exports = { migrateOccasions, newOccasions };
