# Database Migration Guide

This guide will help you migrate your MongoDB Atlas database to the new structure with updated Product Types, Occasions, and Best Seller functionality.

## Prerequisites

1. Make sure your `.env` file in the backend folder has the correct MongoDB Atlas connection string:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name
   ```

2. Ensure you have the latest code changes deployed to your backend.

## Migration Steps

### Step 1: Analyze Existing Data (Optional but Recommended)

First, let's see what data you currently have:

```bash
cd backend
node scripts/analyze-existing-data.js
```

This will show you:
- Total number of products
- Existing product types and occasions
- Legacy category data
- Sample products for review

### Step 2: Run the Main Migration

This will create the new structure and update existing products:

```bash
cd backend
node scripts/migrate-to-new-structure.js
```

This script will:
- Clear existing product types and occasions
- Create new product types: Orchid, Rose Only, Indoor Plant
- Create new occasions: Birthday, Get Well Soon, Anniversary, Sympathy (with nested categories), Congratulation, Wedding, New Baby
- Add `isBestSeller` field to all existing products (defaults to false)

### Step 3: Map Existing Data (Optional)

If you have existing products with legacy categories, run this to map them to the new structure:

```bash
cd backend
node scripts/map-existing-data.js
```

This script will:
- Map legacy categories to appropriate product types
- Map legacy categories to appropriate occasions
- Assign default product types where needed
- Ensure all products have the required fields

## New Data Structure

### Product Types
- **Orchid** 🌸 - Beautiful orchid arrangements
- **Rose Only** 🌹 - Classic rose bouquets  
- **Indoor Plant** 🌱 - Indoor plants and arrangements

### Occasions
- **Birthday** 🎂 - Celebrate special birthdays
- **Get Well Soon** 💐 - Wish someone a speedy recovery
- **Anniversary** 💕 - Celebrate special anniversaries
- **Sympathy** 🕊️ - Express condolences and sympathy
  - Wreaths
  - Casket Sprays
  - Funeral Bouquet
- **Congratulation** 🎉 - Celebrate achievements and milestones
- **Wedding** 💒 - Wedding flowers and arrangements
- **New Baby** 👶 - Welcome new additions to the family

### New Product Fields
- `isBestSeller` (Boolean) - Marks products as best sellers

## Post-Migration Tasks

After running the migration:

1. **Review Products**: Check your products in the dashboard to ensure they have the correct product types and occasions assigned.

2. **Mark Best Sellers**: Update products that should be marked as best sellers by setting `isBestSeller: true`.

3. **Test Filtering**: Verify that the new filtering functionality works correctly in both the main page and dashboard.

4. **Update Product Creation**: When creating new products, make sure to assign appropriate product types and occasions.

## Rollback (If Needed)

If you need to rollback the changes:

1. Restore from a database backup taken before the migration
2. Or manually remove the new fields and restore the old structure

## Troubleshooting

### Connection Issues
- Verify your MongoDB Atlas connection string in `.env`
- Check that your IP address is whitelisted in MongoDB Atlas
- Ensure your database user has the necessary permissions

### Data Issues
- Check the console output for any error messages
- Verify that the migration completed successfully
- Use the analysis script to check the current state

### Performance
- The migration scripts are designed to be safe and efficient
- Large datasets may take some time to process
- Consider running during low-traffic periods

## Support

If you encounter any issues during migration:

1. Check the console output for error messages
2. Verify your database connection
3. Ensure all required fields are present
4. Test with a small subset of data first

The migration scripts include comprehensive logging to help identify any issues.
