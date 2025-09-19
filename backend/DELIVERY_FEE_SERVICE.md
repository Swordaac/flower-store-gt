# Delivery Fee Service

This service provides delivery fee calculation based on Canadian postal codes for the flower store application.

## Files Created

- `utils/deliveryFeeCalculator.js` - Core utility functions for delivery fee calculations
- `routes/delivery.js` - API endpoints for delivery fee operations
- Updated `app.js` - Added delivery route registration

## API Endpoints

### POST /api/delivery/calculate-fee
Calculate delivery fee for a specific postal code.

**Request Body:**
```json
{
  "postalCode": "H1A 0A1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "postalCode": "H1A 0A1",
    "fee": 50,
    "matchType": "exact"
  }
}
```

### GET /api/delivery/check-area/:postalCode
Check if a postal code is in the delivery area.

**Response:**
```json
{
  "success": true,
  "data": {
    "postalCode": "H1A 0A1",
    "inDeliveryArea": true,
    "fee": 50,
    "matchType": "exact"
  }
}
```

### GET /api/delivery/fees
Get all delivery fees (for reference).

**Response:**
```json
{
  "success": true,
  "data": {
    "fees": { "H1A 0A1": 50, ... },
    "count": 189
  }
}
```

### GET /api/delivery/stats
Get delivery fee statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAreas": 189,
    "minFee": 10,
    "maxFee": 60,
    "averageFee": 27.47,
    "uniqueFees": [10, 12, 13, ...]
  }
}
```

### GET /api/delivery/search/:prefix
Search postal codes by prefix.

**Response:**
```json
{
  "success": true,
  "data": {
    "prefix": "H1A",
    "results": [
      { "postalCode": "H1A 0A1", "fee": 50 },
      { "postalCode": "H1A 0A2", "fee": 50 }
    ],
    "count": 2
  }
}
```

## Utility Functions

### calculateDeliveryFee(postalCode)
- Normalizes and calculates delivery fee for a postal code
- Supports exact matches and partial matches (first 3 characters)
- Returns detailed result object with fee, match type, and error handling

### isInDeliveryArea(postalCode)
- Simple boolean check if postal code is in delivery area

### getAllDeliveryFees()
- Returns complete lookup table of postal codes and fees

### getDeliveryFeeStats()
- Returns statistics about the delivery fee data

### normalizePostalCode(postalCode)
- Normalizes postal codes to standard format (removes spaces, converts to uppercase)

### formatPostalCode(postalCode)
- Formats postal codes with proper spacing (e.g., "H1A0A1" → "H1A 0A1")

## Features

- **189 postal codes** covered in the delivery area
- **Fee range**: $10 - $60
- **Smart matching**: Exact matches take priority, then partial matches by prefix
- **Input normalization**: Handles various input formats (with/without spaces, case insensitive)
- **Error handling**: Graceful handling of invalid or unsupported postal codes
- **Public endpoints**: No authentication required for delivery fee calculations

## Usage Example

```javascript
const { calculateDeliveryFee } = require('./utils/deliveryFeeCalculator');

// Calculate fee for a postal code
const result = calculateDeliveryFee('H1A 0A1');
if (result.success) {
  console.log(`Delivery fee: $${result.fee}`);
} else {
  console.log(`Error: ${result.error}`);
}
```

## Integration

The service is fully integrated into the main application and can be used by:

1. **Frontend checkout forms** - Real-time delivery fee calculation
2. **Order processing** - Automatic fee calculation during order creation
3. **Admin panels** - Fee management and statistics
4. **Customer service** - Quick fee lookup for customer inquiries
