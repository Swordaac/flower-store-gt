# PrintNode Integration Setup Guide

This guide will help you set up PrintNode integration for automatically printing recipient details from each order.

## Prerequisites

1. **PrintNode Account**: Sign up at [printnode.com](https://www.printnode.com)
2. **PrintNode Client**: Download and install the PrintNode Client on the computer connected to your printer
3. **Printer Setup**: Ensure your printer is properly installed and recognized by the operating system

## Setup Steps

### 1. Get PrintNode API Key

1. Log in to your PrintNode account
2. Navigate to the API section
3. Generate a new API key
4. Copy the API key for configuration

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# PrintNode Configuration
PRINTNODE_API_KEY=your_printnode_api_key_here
```

### 3. Install PrintNode Client

1. Download the PrintNode Client from [printnode.com/download](https://www.printnode.com/download)
2. Install the client on the computer connected to your printer
3. Log in with your PrintNode account credentials
4. The client will automatically detect and register your printer

### 4. Test the Integration

Use the following API endpoints to test the integration:

#### Test Connection
```bash
GET /api/orders/print/test
Authorization: Bearer <admin_token>
```

#### Get Available Printers
```bash
GET /api/orders/print/printers
Authorization: Bearer <admin_token>
```

#### Get Print Job Statistics
```bash
GET /api/orders/print/stats?days=7
Authorization: Bearer <admin_token>
```

## API Endpoints

### Order Creation with Printing

When creating a new order, include recipient information in the request body:

```json
{
  "shopId": "shop_id_here",
  "items": [...],
  "delivery": {...},
  "recipient": {
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com"
  },
  "notes": "Optional notes"
}
```

The system will automatically:
1. Create the order
2. Generate a PDF with recipient details
3. Submit a print job to PrintNode
4. Log the print job status

### Manual Printing

To manually print an existing order:

```bash
POST /api/orders/:orderId/print
Authorization: Bearer <shop_owner_or_admin_token>
```

## PDF Content

The generated PDF includes:

- **Order Information**: Order number, date
- **Recipient Details**: Name, phone, email
- **Delivery/Pickup Information**: 
  - For delivery: Full address, delivery date/time, special instructions
  - For pickup: Pickup location, date/time
- **Order Items**: List of products with quantities and prices
- **Special Instructions**: Any additional notes or requirements

## Error Handling

The system includes comprehensive error handling and logging:

- **Print Job Logs**: Stored in `backend/logs/print-jobs.log`
- **API Error Logs**: Stored in `backend/logs/printnode-errors.log`
- **System Event Logs**: Stored in `backend/logs/system-events.log`

### Common Issues

1. **No Printers Available**
   - Ensure PrintNode Client is running
   - Check that printer is properly connected
   - Verify printer is registered in PrintNode account

2. **API Authentication Failed**
   - Verify PRINTNODE_API_KEY is correct
   - Check API key permissions

3. **PDF Generation Failed**
   - Check order data completeness
   - Verify recipient information is present

## Monitoring and Maintenance

### View Print Job Statistics

```bash
GET /api/orders/print/stats?days=30
```

Returns:
```json
{
  "success": true,
  "data": {
    "total": 150,
    "successful": 145,
    "failed": 5,
    "successRate": 96.67
  }
}
```

### Clean Old Logs

The system automatically cleans logs older than 30 days. You can manually trigger cleanup by calling:

```javascript
printService.cleanOldLogs(30); // Keep last 30 days
```

## Security Considerations

1. **API Key Security**: Store the PrintNode API key securely in environment variables
2. **Access Control**: Print functionality is restricted to shop owners and admins
3. **Data Privacy**: Recipient information is only printed for legitimate orders
4. **Log Security**: Log files may contain sensitive information - ensure proper file permissions

## Troubleshooting

### Check PrintNode Client Status

1. Open PrintNode Client
2. Verify it's connected to your account
3. Check that your printer appears in the "Printers" tab
4. Ensure the printer status is "Online"

### Verify API Connection

```bash
curl -u YOUR_API_KEY: https://api.printnode.com/whoami
```

Should return your account information.

### Check Logs

Review the log files in `backend/logs/` for detailed error information:

- `print-jobs.log`: Individual print job attempts and results
- `printnode-errors.log`: API communication errors
- `system-events.log`: General system events

## Support

For PrintNode-specific issues:
- [PrintNode Documentation](https://www.printnode.com/en/docs/api)
- [PrintNode Support](https://www.printnode.com/en/support)

For integration issues:
- Check the application logs
- Verify environment configuration
- Test API endpoints individually
