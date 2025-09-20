const mongoose = require('mongoose');
const ProductType = require('../models/ProductType');
const Occasion = require('../models/Occasion');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flower-store', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const productTypes = [
  {
    name: 'Orchid',
    description: 'Beautiful orchid arrangements',
    color: '#E91E63',
    icon: '🌸',
    sortOrder: 1
  },
  {
    name: 'Rose Only',
    description: 'Classic rose bouquets',
    color: '#F44336',
    icon: '🌹',
    sortOrder: 2
  },
  {
    name: 'Indoor Plant',
    description: 'Indoor plants and arrangements',
    color: '#4CAF50',
    icon: '🌱',
    sortOrder: 3
  }
];

const occasions = [
  {
    name: 'Birthday',
    description: 'Celebrate special birthdays',
    color: '#FF9800',
    icon: '🎂',
    sortOrder: 1
  },
  {
    name: 'Get Well Soon',
    description: 'Wish someone a speedy recovery',
    color: '#9C27B0',
    icon: '💐',
    sortOrder: 2
  },
  {
    name: 'Anniversary',
    description: 'Celebrate special anniversaries',
    color: '#E91E63',
    icon: '💕',
    sortOrder: 3
  },
  {
    name: 'Sympathy',
    description: 'Express condolences and sympathy',
    color: '#607D8B',
    icon: '🕊️',
    sortOrder: 4,
    sympathy: ['Wreaths', 'Casket Sprays', 'Funeral Bouquet']
  },
  {
    name: 'Congratulation',
    description: 'Celebrate achievements and milestones',
    color: '#4CAF50',
    icon: '🎉',
    sortOrder: 5
  },
  {
    name: 'Wedding',
    description: 'Wedding flowers and arrangements',
    color: '#FFC107',
    icon: '💒',
    sortOrder: 6
  },
  {
    name: 'New Baby',
    description: 'Welcome new additions to the family',
    color: '#00BCD4',
    icon: '👶',
    sortOrder: 7
  }
];

async function populateData() {
  try {
    console.log('Starting data population...');

    // Clear existing data
    await ProductType.deleteMany({});
    await Occasion.deleteMany({});

    // Insert product types
    console.log('Inserting product types...');
    const createdProductTypes = await ProductType.insertMany(productTypes);
    console.log(`Created ${createdProductTypes.length} product types`);

    // Insert occasions
    console.log('Inserting occasions...');
    const createdOccasions = await Occasion.insertMany(occasions);
    console.log(`Created ${createdOccasions.length} occasions`);

    console.log('Data population completed successfully!');
    console.log('\nProduct Types:');
    createdProductTypes.forEach(type => {
      console.log(`- ${type.name} (${type.color})`);
    });

    console.log('\nOccasions:');
    createdOccasions.forEach(occasion => {
      console.log(`- ${occasion.name} (${occasion.color})`);
      if (occasion.sympathy && occasion.sympathy.length > 0) {
        console.log(`  Sympathy categories: ${occasion.sympathy.join(', ')}`);
      }
    });

  } catch (error) {
    console.error('Error populating data:', error);
  } finally {
    mongoose.connection.close();
  }
}

populateData();
