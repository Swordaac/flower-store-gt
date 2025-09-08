import { loadStripe, Stripe } from '@stripe/stripe-js';

// Get the publishable key from environment variables
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
}

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

export default getStripe;

// Stripe configuration
export const STRIPE_CONFIG = {
  currency: 'cad',
  paymentMethodTypes: ['card'],
  billingAddressCollection: 'required',
  shippingAddressCollection: {
    allowedCountries: ['CA', 'US'],
  },
} as const;
