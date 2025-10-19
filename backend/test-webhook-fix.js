require('dotenv').config();
const axios = require('axios');

// Test the webhook endpoint with a payment_intent.succeeded event
const testWebhook = async () => {
  try {
    console.log('🧪 Testing webhook fix...\n');

    const testEvent = {
      id: 'evt_test_webhook_fix',
      object: 'event',
      api_version: '2025-08-27.basil',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'pi_test_webhook_fix',
          object: 'payment_intent',
          amount: 119689, // $1,196.89 in cents
          currency: 'cad',
          status: 'succeeded',
          created: Math.floor(Date.now() / 1000),
          description: 'Test payment intent for webhook fix'
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: null,
        idempotency_key: 'test-webhook-fix-key'
      },
      type: 'payment_intent.succeeded'
    };

    console.log('Sending test event:', JSON.stringify(testEvent, null, 2));

    // Test without signature to trigger fallback JSON parsing
    const response = await axios.post(
      'https://fleuristecrescent.com/api/stripe/webhook',
      testEvent,
      {
        headers: {
          'Content-Type': 'application/json'
          // No Stripe-Signature header to trigger fallback parsing
        }
      }
    );

    console.log('✅ Webhook test successful!');
    console.log('Response:', response.data);

  } catch (error) {
    console.error('❌ Webhook test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
};

// Run the test
testWebhook();
