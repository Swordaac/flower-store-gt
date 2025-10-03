# Deployment Guide for Flower Store with PrintNode

## Fixed Issues ✅

1. **TypeScript Error Fixed**: Fixed the `NotificationBadge.tsx` component that was causing build failures
2. **PrintNode Cloud Integration**: Added cloud-optimized print service for Render deployment
3. **Build Success**: Frontend now builds successfully

## Deployment Steps

### 1. Frontend Deployment (Vercel/Netlify)

The frontend is ready to deploy. The TypeScript error has been fixed.

### 2. Backend Deployment (Render)

#### Environment Variables to Set in Render:

```env
# Database
MONGO_URI=your_mongodb_connection_string

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT
JWT_SECRET=your_jwt_secret_here

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# PrintNode
PRINTNODE_API_KEY=your_printnode_api_key

# Environment
NODE_ENV=production
RENDER=true
```

#### Build Command:
```bash
cd backend && npm install
```

#### Start Command:
```bash
cd backend && npm start
```

### 3. PrintNode Client Setup

1. **Install PrintNode Client** on your local computer:
   - Download from [printnode.com/download](https://www.printnode.com/download)
   - Install and sign in with your PrintNode account
   - Connect your printer

2. **Keep the client running** when you want to receive prints

## How It Works After Deployment

### Order Flow:
1. **Customer** creates order on frontend
2. **Frontend** sends order to Render backend
3. **Backend** processes order and generates PDF
4. **Backend** sends print job to PrintNode API
5. **PrintNode API** forwards job to your local PrintNode Client
6. **Local printer** prints the order details

### Testing the Deployment:

1. **Test PrintNode Connection**:
   ```bash
   GET https://your-app.onrender.com/api/orders/print/test
   ```

2. **Test Order Creation**:
   - Create an order through your frontend
   - Check Render logs for print job attempts
   - Verify print appears on your local printer

## Troubleshooting

### Build Issues:
- ✅ **Fixed**: TypeScript error in NotificationBadge.tsx
- ✅ **Fixed**: Build now completes successfully

### Print Issues:
- **No prints**: Ensure PrintNode Client is running locally
- **API errors**: Check PrintNode API key in Render environment variables
- **Connection issues**: Verify PrintNode Client is connected (orange/green icon)

### Common Render Issues:
- **Port conflicts**: Backend automatically uses PORT environment variable
- **Environment variables**: Ensure all required variables are set in Render dashboard
- **Build failures**: Check build logs in Render dashboard

## Monitoring

### Check Print Job Status:
```bash
GET https://your-app.onrender.com/api/orders/print/stats
```

### View Logs:
- **Render Dashboard**: Check backend logs
- **PrintNode Dashboard**: Check print job status
- **Local PrintNode Client**: Check connection status

## Security Notes

1. **API Keys**: Store all API keys securely in Render environment variables
2. **Database**: Use MongoDB Atlas with proper security settings
3. **PrintNode**: Keep your PrintNode API key secure
4. **Local Client**: Only run PrintNode Client on trusted machines

## Support

- **Render Issues**: [render.com/docs](https://render.com/docs)
- **PrintNode Issues**: [printnode.com/support](https://www.printnode.com/support)
- **Next.js Issues**: [nextjs.org/docs](https://nextjs.org/docs)
