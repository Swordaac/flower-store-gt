# Database Index Fix Instructions

## Problem
The application is getting a 500 error when creating products with the message:
```
Field 'category' of text index contains an array
```

This happens because there's an existing text index in MongoDB that includes the `category` field, but now `category` is an array, which conflicts with MongoDB's text index requirements.

## Solution
Run the database fix script to drop the existing text index and create a new one that only includes text fields (name and description).

## Steps to Fix

1. **Make sure MongoDB is running:**
   ```bash
   # If using Homebrew on macOS
   brew services start mongodb-community
   
   # Or start manually
   mongod
   ```

2. **Run the fix script:**
   ```bash
   cd backend
   node scripts/fix-database-indexes.js
   ```

3. **Verify the fix:**
   - The script will show you all current indexes
   - It will drop any text indexes that include array fields
   - It will create a new text index only on `name` and `description` fields
   - You should see "Database index fix completed successfully!"

4. **Test product creation:**
   - Try creating a product in the frontend
   - It should now work without the 500 error

## What the Script Does

1. **Lists current indexes** - Shows all existing indexes in the products collection
2. **Identifies text indexes** - Finds any indexes with `textIndexVersion`
3. **Drops conflicting indexes** - Removes text indexes that include array fields
4. **Creates correct index** - Creates a new text index only on `name` and `description`
5. **Verifies results** - Shows the final index list

## Expected Output
```
🚀 Starting database index fix...
✅ Connected to MongoDB

📋 Current indexes:
1. _id_ (): {"_id":1}
2. name_text_description_text (TEXT): {"name":"text","description":"text","category":"text"}

🔍 Found 1 text index(es)
🗑️  Dropping text index: name_text_description_text
✅ Successfully dropped: name_text_description_text

🔨 Creating new text index on name and description only...
✅ Text index created successfully

📋 Final indexes:
1. _id_ (): {"_id":1}
2. name_text_description_text (TEXT): {"name":"text","description":"text"}

🎉 Database index fix completed successfully!
You can now create products with category arrays.
```

## Troubleshooting

- **MongoDB not running**: Start MongoDB first before running the script
- **Permission errors**: Make sure you have write access to the database
- **Connection issues**: Check your MongoDB connection string in the environment variables

## After the Fix

Once the fix is applied, you can:
- Create products with category arrays
- Use the search functionality (it will use regex instead of text search temporarily)
- All other functionality will work normally

The text search will work on product names and descriptions, but not on categories (which is fine since categories are now arrays and should be filtered separately).
