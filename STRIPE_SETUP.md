# Stripe Integration Setup Guide

This guide will help you set up Stripe Checkout integration for your flower store application.

## Prerequisites

1. A Stripe account (create one at [stripe.com](https://stripe.com))
2. Node.js and npm installed
3. MongoDB running locally or accessible

## Backend Setup

### 1. Install Dependencies

The Stripe dependency has already been installed. If you need to reinstall:

```bash
cd backend
npm install stripe
```

### 2. Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Existing variables...
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 3. Get Stripe Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers > API keys**
3. Copy your **Publishable key** and **Secret key**
4. For webhook secret, you'll need to set up a webhook endpoint first (see below)

### 4. Set Up Webhook Endpoint

1. In Stripe Dashboard, go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `http://localhost:5001/api/stripe/webhook` (for development)
4. Select these events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret and add it to your `.env` file

## Frontend Setup

### 1. Install Dependencies

The Stripe frontend dependency has already been installed. If you need to reinstall:

```bash
npm install @stripe/stripe-js --legacy-peer-deps
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Existing variables...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## Testing the Integration

### 1. Start the Backend

```bash
cd backend
npm run dev
```

### 2. Start the Frontend

```bash
npm run dev
```

### 3. Test the Flow

1. Add items to your cart
2. Go to the cart page
3. Click "Proceed to Checkout"
4. Fill out the checkout form
5. Click "Pay with Stripe"
6. You'll be redirected to Stripe's checkout page
7. Use test card numbers:
   - **Success**: 4242 4242 4242 4242
   - **Decline**: 4000 0000 0000 0002
   - **Requires authentication**: 4000 0025 0000 3155

## Features Implemented

### Backend Features

- ✅ Payment model for tracking Stripe payments
- ✅ Updated Order model with Stripe integration
- ✅ Stripe configuration and helper functions
- ✅ Checkout session creation endpoint
- ✅ Webhook handling for payment events
- ✅ Automatic order confirmation on successful payment
- ✅ Product quantity updates after successful payment

### Frontend Features

- ✅ Stripe configuration and initialization
- ✅ Checkout form with delivery/pickup options
- ✅ Stripe checkout button component
- ✅ Success and cancel pages
- ✅ Cart integration with Stripe checkout
- ✅ Error handling and loading states

## API Endpoints

### POST /api/stripe/create-checkout-session
Creates a Stripe checkout session for an order.

**Request Body:**
```json
{
  "shopId": "shop_id",
  "items": [
    {
      "productId": "product_id",
      "quantity": 2
    }
  ],
  "delivery": {
    "method": "delivery",
    "address": {
      "street": "123 Main St",
      "city": "Toronto",
      "province": "ON",
      "postalCode": "M5V 3A8",
      "country": "Canada"
    },
    "deliveryTime": "14:00",
    "contactPhone": "(555) 123-4567",
    "contactEmail": "customer@example.com"
  },
  "notes": "Special instructions"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/...",
  "orderId": "order_id"
}
```

### GET /api/stripe/checkout-session/:sessionId
Retrieves checkout session details.

### POST /api/stripe/webhook
Handles Stripe webhook events (no authentication required).

## Security Notes

1. **Never expose secret keys** in frontend code
2. **Always verify webhook signatures** (implemented)
3. **Use HTTPS in production** for webhook endpoints
4. **Validate all input data** before processing
5. **Handle payment failures gracefully**

## Production Deployment

### 1. Update Environment Variables

Replace test keys with live keys:
- `STRIPE_SECRET_KEY=sk_live_...`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`

### 2. Update Webhook URL

Set webhook endpoint to your production URL:
`https://yourdomain.com/api/stripe/webhook`

### 3. Update Success/Cancel URLs

Update URLs in `backend/config/stripe.js`:
```javascript
successUrl: 'https://yourdomain.com/checkout/success',
cancelUrl: 'https://yourdomain.com/checkout/cancel',
```

## Troubleshooting

### Common Issues

1. **"Stripe failed to load"**
   - Check that `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set correctly
   - Ensure the key starts with `pk_test_` or `pk_live_`

2. **"Webhook signature verification failed"**
   - Check that `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure webhook endpoint is accessible

3. **"Order not found for session"**
   - Check that the order was created before the webhook event
   - Verify the session ID is being stored correctly

4. **Payment not completing**
   - Check webhook events in Stripe Dashboard
   - Verify webhook endpoint is receiving events
   - Check server logs for errors

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will log detailed information about Stripe operations.

## Support

For Stripe-specific issues, consult:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

For application-specific issues, check the server logs and browser console for error messages.
