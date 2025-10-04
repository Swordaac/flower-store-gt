const mongoose = require('mongoose');
const Product = require('../models/Product');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flowerstore', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function fixDuplicateSlugs() {
  try {
    console.log('🔍 Checking for duplicate slugs...');
    
    // Find all products without slugs or with duplicate slugs
    const products = await Product.find({}).sort({ createdAt: 1 });
    
    const slugCounts = {};
    const productsToUpdate = [];
    
    // Count slug occurrences
    products.forEach(product => {
      if (product.slug) {
        slugCounts[product.slug] = (slugCounts[product.slug] || 0) + 1;
      }
    });
    
    // Find products that need slug updates
    products.forEach(product => {
      if (!product.slug || (product.slug && slugCounts[product.slug] > 1)) {
        productsToUpdate.push(product);
      }
    });
    
    console.log(`📊 Found ${productsToUpdate.length} products that need slug updates`);
    
    // Update slugs for products that need them
    for (const product of productsToUpdate) {
      let baseSlug;
      
      if (product.slug) {
        // If product has a slug but it's duplicated, use the name
        baseSlug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      } else {
        // If product has no slug, generate from name
        baseSlug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      
      let slug = baseSlug;
      let counter = 1;
      
      // Find a unique slug
      while (true) {
        const existingProduct = await Product.findOne({ 
          slug: slug, 
          _id: { $ne: product._id } 
        });
        
        if (!existingProduct) {
          break;
        }
        
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      // Update the product
      product.slug = slug;
      await product.save();
      
      console.log(`✅ Updated product "${product.name}" with slug: "${slug}"`);
    }
    
    console.log('🎉 Duplicate slug fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing duplicate slugs:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
fixDuplicateSlugs();
