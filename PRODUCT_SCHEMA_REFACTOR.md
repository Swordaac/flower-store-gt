# Product Schema Refactor Documentation

## Overview

This document outlines the refactoring of the product schema to support multiple productTypes and occasions with per-variant tier logic. The changes maintain backwards compatibility while introducing a more flexible and scalable product structure.

## Key Changes

### 1. New Models

#### ProductType Model (`backend/models/ProductType.js`)
- Stores product type categories (e.g., Bouquets, Single Flowers, Plants)
- Fields: name, description, slug, isActive, sortOrder, icon, color
- Many-to-many relationship with products

#### Occasion Model (`backend/models/Occasion.js`)
- Stores occasions (e.g., Wedding, Birthday, Sympathy)
- Fields: name, description, slug, isActive, sortOrder, icon, color, isSeasonal, seasonalStart, seasonalEnd
- Many-to-many relationship with products

### 2. Updated Product Schema

#### New Fields
- `productTypes`: Array of ObjectIds referencing ProductType
- `occasions`: Array of ObjectIds referencing Occasion
- `variants`: Array of variant objects with tier-specific pricing, stock, and images

#### Variant Structure
```javascript
{
  tierName: 'standard' | 'deluxe' | 'premium',
  price: Number, // in cents
  stock: Number,
  images: [{
    size: 'small' | 'medium' | 'large' | 'xlarge',
    publicId: String,
    url: String,
    alt: String,
    isPrimary: Boolean
  }],
  isActive: Boolean
}
```

#### Legacy Fields (Deprecated)
- `price`: Legacy price structure (maintained for backwards compatibility)
- `stock`: Legacy stock field (maintained for backwards compatibility)
- `category`: Legacy category array (maintained for backwards compatibility)
- `images`: Legacy images array (maintained for backwards compatibility)
- `deluxeImage`, `premiumImage`: Legacy tier-specific images (maintained for backwards compatibility)

### 3. Updated API Endpoints

#### New Endpoints
- `GET /api/products/types` - Get all product types
- `GET /api/products/occasions` - Get all occasions
- `POST /api/products/types` - Create product type (admin only)
- `POST /api/products/occasions` - Create occasion (admin only)

#### Updated Endpoints
- `GET /api/products` - Added productTypes and occasions filtering
- `GET /api/products/:id` - Populates productTypes and occasions
- `POST /api/products` - Handles new schema with backwards compatibility
- `PUT /api/products/:id` - Handles new schema with backwards compatibility
- `GET /api/products/shop/:shopId` - Added productTypes and occasions filtering

#### New Query Parameters
- `productTypes`: Filter by product type IDs
- `occasions`: Filter by occasion IDs

### 4. Updated Frontend Components

#### ProductForm Component
- Added productTypes and occasions selection
- Replaced tiered pricing with variant management
- Maintains backwards compatibility with legacy fields
- Loads productTypes and occasions from API

## Migration Process

### 1. Run Migration Script

```bash
cd backend
node scripts/migrate-product-schema.js
```

This script will:
- Create default product types based on existing categories
- Create default occasions
- Migrate existing products to new schema structure
- Convert legacy price structure to variants

### 2. Seed Sample Data (Optional)

```bash
cd backend
node scripts/seed-product-data.js
```

This script will:
- Create sample product types and occasions
- Create sample products with the new schema

## Breaking Changes

### Minimal Breaking Changes
1. **New Required Fields**: `productTypes` is now required for new products
2. **API Response Changes**: Product responses now include populated `productTypes` and `occasions`
3. **Form Changes**: ProductForm now uses variant-based pricing instead of fixed tiers

### Backwards Compatibility
- All legacy fields are maintained
- Existing products continue to work
- Legacy price structure is automatically converted to variants
- API endpoints handle both old and new data structures

## Testing

### 1. Test Migration
```bash
# Run migration
node backend/scripts/migrate-product-schema.js

# Verify data integrity
node backend/scripts/seed-product-data.js
```

### 2. Test API Endpoints
```bash
# Test product types
curl http://localhost:5001/api/products/types

# Test occasions
curl http://localhost:5001/api/products/occasions

# Test product creation with new schema
curl -X POST http://localhost:5001/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Product",
    "color": "red",
    "description": "Test description",
    "productTypes": ["PRODUCT_TYPE_ID"],
    "occasions": ["OCCASION_ID"],
    "variants": [
      {
        "tierName": "standard",
        "price": "2500",
        "stock": "10",
        "images": [],
        "isActive": true
      }
    ]
  }'
```

### 3. Test Frontend
1. Open product creation form
2. Verify productTypes and occasions load
3. Test variant pricing and stock management
4. Submit form and verify data is saved correctly

## Performance Considerations

### Indexing
- Added indexes for productTypes, occasions, and variant fields
- Text search index re-enabled
- Optimized queries for filtering and sorting

### Query Optimization
- Populate productTypes and occasions only when needed
- Use lean queries for list endpoints
- Efficient filtering by variant stock and pricing

## Future Enhancements

### Potential Improvements
1. **Dynamic Variants**: Allow custom tier names beyond standard/deluxe/premium
2. **Variant Images**: Per-variant image management
3. **Seasonal Pricing**: Time-based pricing for variants
4. **Bulk Operations**: Bulk variant management
5. **Analytics**: Variant-specific sales analytics

### Migration to Full New Schema
1. Update all frontend components to use variants
2. Remove legacy field dependencies
3. Update database queries to use new structure
4. Remove legacy fields from schema (after full migration)

## Troubleshooting

### Common Issues

1. **Migration Fails**: Check MongoDB connection and permissions
2. **ProductTypes Not Loading**: Verify API endpoints are working
3. **Form Validation Errors**: Check required fields are populated
4. **Image Upload Issues**: Verify shopId is provided

### Debug Commands
```bash
# Check product types
curl http://localhost:5001/api/products/types

# Check occasions
curl http://localhost:5001/api/products/occasions

# Check product with new schema
curl http://localhost:5001/api/products/PRODUCT_ID
```

## Support

For issues or questions regarding this refactor:
1. Check this documentation
2. Review the migration scripts
3. Test with sample data
4. Check API responses for data structure
