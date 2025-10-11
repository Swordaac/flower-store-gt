# Product Type Migration Guide

This guide explains how to migrate the MongoDB Atlas database to use the new product types.

## New Product Types

The migration will replace all existing product types with these 7 new types:

1. **Rose** 🌹 - Beautiful rose arrangements (#F44336)
2. **Bouquet** 💐 - Classic flower bouquets (#E91E63)
3. **Bouquet in Vase** 🏺 - Flower bouquets arranged in decorative vases (#9C27B0)
4. **Indoor Plants** 🌱 - Indoor plants and greenery (#4CAF50)
5. **Orchid** 🌸 - Elegant orchid arrangements (#FF9800)
6. **Fruit Basket** 🍎 - Fruit baskets and arrangements (#FF5722)
7. **Flowers Box** 📦 - Flower arrangements in decorative boxes (#795548)

## Migration Process

### Step 1: Test Current State

First, check the current state of your database:

```bash
cd backend
npm run test:migration
```

This will show you:
- Current product types in the database
- Products that reference product types
- Products without product types

### Step 2: Set Environment Variables

Make sure your MongoDB Atlas connection string is set in your environment:

```bash
export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/database-name"
```

Or create a `.env` file in the backend directory:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name
```

### Step 3: Run Migration

Execute the migration script:

```bash
cd backend
npm run migrate:product-types
```

## What the Migration Does

1. **Creates New Product Types**: Adds the 7 new product types to the database
2. **Maps Existing Products**: Intelligently maps existing products to new product types based on name similarity:
   - Products with "rose" in the type name → "Rose"
   - Products with "bouquet" in the type name → "Bouquet"
   - Products with "vase" in the type name → "Bouquet in Vase"
   - Products with "plant" in the type name → "Indoor Plants"
   - Products with "orchid" in the type name → "Orchid"
   - Products with "fruit" or "basket" in the type name → "Fruit Basket"
   - Products with "box" in the type name → "Flowers Box"
   - All other products → "Bouquet" (default)

3. **Removes Old Types**: Deletes all product types that are not in the new list
4. **Updates Product References**: Updates all products to reference the new product types

## Safety Features

- **Backup Recommended**: Always backup your database before running migrations
- **Dry Run**: The test script shows you what will happen before you run the actual migration
- **Intelligent Mapping**: Products are mapped based on name similarity to preserve data integrity
- **Default Fallback**: Products that don't match any specific type are assigned to "Bouquet"

## Rollback

If you need to rollback the migration, you would need to:
1. Restore from a database backup
2. Or manually recreate the old product types and remap products

## Verification

After running the migration, verify the results:

```bash
npm run test:migration
```

This will show you the final state of your product types and confirm the migration was successful.

## Troubleshooting

### Connection Issues
- Verify your MongoDB Atlas connection string
- Check that your IP address is whitelisted in MongoDB Atlas
- Ensure your database user has read/write permissions

### Migration Errors
- Check the console output for specific error messages
- Verify that all required models are properly imported
- Ensure the database is accessible and not locked

### Product Mapping Issues
- Review the mapping logic in the migration script
- Manually update any products that weren't mapped correctly
- Use the test script to verify mappings before running the full migration
