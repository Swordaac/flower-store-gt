# Print Configuration Guide

This guide explains how to use the enhanced print system with customizable card layouts and tray selection for different document types.

## Overview

The enhanced print system allows you to:
- Choose different printer trays for different document types
- Customize print layouts for delivery instructions, card messages, and order summaries
- Test print configurations before printing actual orders
- Manage print preferences per order

## Document Types

### 1. Delivery Instructions
- **Paper Size**: A4
- **Orientation**: Portrait
- **Content**: Recipient information, delivery address, special instructions, buzzer code
- **Default Tray**: Main paper tray
- **Use Case**: Instructions for delivery personnel

### 2. Card Message
- **Paper Size**: A6 (compact)
- **Orientation**: Portrait
- **Content**: Card message, occasion, order reference
- **Default Tray**: Card stock tray (if available)
- **Use Case**: Message card to accompany the flowers

### 3. Order Summary
- **Paper Size**: A4
- **Orientation**: Portrait
- **Content**: Order items, pricing, financial summary
- **Default Tray**: Main paper tray
- **Use Case**: Internal order tracking and record keeping

## API Endpoints

### Get Available Printers with Tray Information
```bash
GET /api/print-config/printers
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "printer_123",
      "name": "HP LaserJet Pro",
      "state": "online",
      "hasMultipleTrays": true,
      "trays": [
        {
          "name": "Tray 1",
          "id": "tray1",
          "description": "Main paper tray"
        },
        {
          "name": "Tray 2",
          "id": "tray2",
          "description": "Secondary paper tray"
        },
        {
          "name": "Card Stock",
          "id": "cardstock",
          "description": "Card stock tray"
        }
      ]
    }
  ]
}
```

### Get Print Layouts
```bash
GET /api/print-config/layouts
Authorization: Bearer <admin_token>
```

### Test Print Configuration
```bash
POST /api/print-config/test-print
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "printType": "deliveryInstructions",
  "printerId": "printer_123",
  "trayId": "tray1",
  "layout": {
    "paperSize": "A4",
    "orientation": "portrait",
    "margins": { "top": 50, "bottom": 50, "left": 50, "right": 50 },
    "fontSizes": { "title": 18, "subtitle": 14, "body": 12, "small": 10 },
    "colors": { "primary": "#2c3e50", "secondary": "#34495e", "accent": "#e74c3c", "muted": "#7f8c8d" }
  }
}
```

### Print Order with Configuration
```bash
POST /api/print-config/print-order
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "orderId": "order_123",
  "printConfig": {
    "deliveryInstructionsTray": "tray1",
    "cardMessageTray": "cardstock",
    "orderSummaryTray": "tray1",
    "printAllDocuments": true,
    "printDeliveryInstructions": true,
    "printCardMessage": true,
    "printOrderSummary": true,
    "printerId": "printer_123"
  }
}
```

## Frontend Component Usage

### Basic Usage
```tsx
import PrintConfiguration from '@/components/PrintConfiguration';

function OrderManagement() {
  const handlePrintComplete = (results) => {
    console.log('Print results:', results);
  };

  const handleTestPrint = (config) => {
    console.log('Test print config:', config);
  };

  return (
    <PrintConfiguration
      orderId="order_123"
      onPrintComplete={handlePrintComplete}
      onTestPrint={handleTestPrint}
    />
  );
}
```

### Advanced Configuration
```tsx
<PrintConfiguration
  orderId={order.id}
  onPrintComplete={(results) => {
    if (results.success) {
      showNotification('Order documents printed successfully');
    } else {
      showError('Some documents failed to print');
    }
  }}
  onTestPrint={(config) => {
    console.log('Testing print configuration:', config);
  }}
/>
```

## Print Preferences in Order Model

Orders now include print preferences:

```javascript
{
  printPreferences: {
    deliveryInstructionsTray: 'default',
    cardMessageTray: 'cardstock',
    orderSummaryTray: 'default',
    customLayouts: {
      deliveryInstructions: null,
      cardMessage: null,
      orderSummary: null
    },
    printAllDocuments: true,
    printDeliveryInstructions: true,
    printCardMessage: true,
    printOrderSummary: true
  }
}
```

## Tray Configuration

### Supported Tray Types
- **Default Tray**: Main paper source
- **Tray 1, 2, 3**: Additional paper trays
- **Manual Feed**: Manual paper insertion
- **Envelope Tray**: For envelope printing
- **Card Stock**: Thick paper for cards
- **Photo Paper**: High-quality photo paper

### Tray Selection Logic
1. System detects available trays from printer capabilities
2. Maps common tray names to standardized IDs
3. Falls back to 'default' if no specific tray is found
4. Allows manual override of tray selection

## Custom Layouts

### Layout Configuration Structure
```javascript
{
  paperSize: 'A4', // 'A4', 'A6', 'Letter', etc.
  orientation: 'portrait', // 'portrait' or 'landscape'
  margins: {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50
  },
  fontSizes: {
    title: 18,
    subtitle: 14,
    body: 12,
    small: 10
  },
  colors: {
    primary: '#2c3e50',
    secondary: '#34495e',
    accent: '#e74c3c',
    muted: '#7f8c8d'
  }
}
```

### Creating Custom Layouts
```bash
POST /api/print-config/custom-layout
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "layoutName": "Custom Card Layout",
  "layoutType": "cardMessage",
  "configuration": {
    "paperSize": "A6",
    "orientation": "portrait",
    "margins": { "top": 30, "bottom": 30, "left": 30, "right": 30 },
    "fontSizes": { "title": 16, "subtitle": 12, "body": 11, "small": 9 },
    "colors": { "primary": "#2c3e50", "secondary": "#34495e", "accent": "#e74c3c", "muted": "#7f8c8d" }
  }
}
```

## Error Handling

### Common Error Scenarios
1. **No printers available**: PrintNode Client not running locally
2. **Invalid tray selection**: Tray not available on selected printer
3. **Print job failed**: Network issues or printer offline
4. **Layout validation error**: Invalid configuration parameters

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "message": "User-friendly error description"
}
```

## Best Practices

### 1. Tray Selection
- Use card stock tray for card messages
- Use main tray for delivery instructions and order summaries
- Test tray availability before production use

### 2. Layout Design
- Keep margins consistent across document types
- Use appropriate font sizes for paper size
- Ensure good contrast for readability

### 3. Print Testing
- Always test print configurations before production
- Verify tray selection works correctly
- Check print quality and formatting

### 4. Error Handling
- Implement proper error handling in frontend
- Show user-friendly error messages
- Provide fallback options for failed prints

## Troubleshooting

### Print Not Working
1. Check PrintNode Client is running and connected
2. Verify printer is online and accessible
3. Test with simple print job first
4. Check API key configuration

### Tray Selection Issues
1. Verify printer supports multiple trays
2. Check tray names match printer capabilities
3. Use 'default' tray as fallback
4. Test with different tray configurations

### Layout Problems
1. Validate layout configuration parameters
2. Check paper size compatibility
3. Verify margin settings are reasonable
4. Test with different font sizes

## Support

For additional support:
- Check PrintNode documentation: [printnode.com/docs](https://www.printnode.com/docs)
- Review system logs for detailed error information
- Test with PrintNode's web interface for printer capabilities
