# PrintNode Cloud Setup Guide

This guide explains how to set up PrintNode for cloud deployment (Render) while keeping printing local.

## Architecture Overview

```
Frontend (Vercel/Netlify) → Backend (Render) → PrintNode API → PrintNode Client (Your Local Computer) → Physical Printer
```

## Setup Steps

### 1. Install PrintNode Client Locally

1. **Download PrintNode Client**:
   - Go to [printnode.com/download](https://www.printnode.com/download)
   - Download the client for your operating system (Mac/Windows/Linux)

2. **Install and Setup**:
   - Install the PrintNode Client on your local computer
   - Sign in with your PrintNode account credentials
   - The client will automatically detect and register your printer

3. **Verify Connection**:
   - Look for the PrintNode icon in your system tray/menu bar
   - It should be orange and green (connected)
   - If orange and red, there's a connection issue

### 2. Configure Environment Variables

Add these to your Render environment variables:

```env
# PrintNode Configuration
PRINTNODE_API_KEY=your_printnode_api_key_here

# Environment
NODE_ENV=production
RENDER=true
```

### 3. Update Your Backend Code

Replace the print service import in your order routes:

```javascript
// Change this line in routes/orders.js
const printService = require('../services/printService');

// To this:
const printService = require('../services/printServiceCloud');
```

### 4. Deploy to Render

1. **Push your code** to your Git repository
2. **Deploy to Render** with the environment variables set
3. **Test the connection** using the API endpoint: `GET /api/orders/print/test`

### 5. Test the Setup

1. **Create a test order** through your frontend
2. **Check the logs** in Render dashboard
3. **Verify printing** - the order should print on your local printer

## How It Works

### Local Development
- Backend runs locally
- PrintNode Client runs locally
- Direct communication between backend and printer

### Cloud Production
- Backend runs on Render
- PrintNode Client runs on your local computer
- Communication: Backend → PrintNode API → Local Client → Printer

## Troubleshooting

### No Prints Appearing

1. **Check PrintNode Client Status**:
   - Ensure it's running and connected (orange/green icon)
   - Check if your printer is listed and online

2. **Check API Connection**:
   - Test: `GET https://your-app.onrender.com/api/orders/print/test`
   - Should return success with account info

3. **Check Logs**:
   - Look for print job logs in Render dashboard
   - Check for error messages

### Common Issues

1. **"No printers available"**:
   - PrintNode Client not running locally
   - Printer not connected to PrintNode Client

2. **"Print job failed"**:
   - Check PrintNode API key
   - Verify printer is online in PrintNode dashboard

3. **"Connection failed"**:
   - Check internet connection
   - Verify PrintNode API key is correct

## Alternative Solutions

### Option A: VPS with Printer Access
- Deploy backend to a VPS (DigitalOcean, AWS EC2)
- Install PrintNode Client on the VPS
- Connect a network printer to the VPS

### Option B: Cloud Printing Services
- Use Google Cloud Print (deprecated)
- Use AWS Print services
- Use other cloud printing solutions

### Option C: Email-to-Print
- Send PDFs via email to a printer with email capability
- Use services like PrintNode's email printing

## Monitoring

### Check Print Job Status
```bash
GET /api/orders/print/stats
```

### View Print Logs
- Check Render logs for print job attempts
- Monitor PrintNode dashboard for job status

## Security Considerations

1. **API Key Security**: Store PrintNode API key securely in Render environment variables
2. **Local Network**: Ensure your local computer has stable internet connection
3. **Printer Access**: Only authorized users should have access to the printer

## Support

- **PrintNode Support**: [printnode.com/support](https://www.printnode.com/support)
- **PrintNode Documentation**: [printnode.com/docs](https://www.printnode.com/docs)
- **Render Support**: [render.com/docs](https://render.com/docs)
