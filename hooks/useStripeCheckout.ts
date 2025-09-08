import { useState } from 'react';
import { useRouter } from 'next/navigation';
import getStripe from '@/lib/stripe';

interface CheckoutSessionData {
  shopId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  delivery: {
    method: 'delivery' | 'pickup';
    address?: {
      street: string;
      city: string;
      province: string;
      postalCode: string;
      country: string;
    };
    deliveryTime?: string;
    pickupTime?: string;
    pickupLocationId?: string;
    contactPhone: string;
    contactEmail: string;
    specialInstructions?: string;
  };
  notes?: string;
}

interface CheckoutResult {
  success: boolean;
  sessionId?: string;
  url?: string;
  orderId?: string;
  error?: string;
}

export const useStripeCheckout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const createCheckoutSession = async (data: CheckoutSessionData): Promise<CheckoutResult> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('Sending checkout data:', JSON.stringify(data, null, 2));
      
      const response = await fetch('http://localhost:5001/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create checkout session');
      }

      return {
        success: true,
        sessionId: result.sessionId,
        url: result.url,
        orderId: result.orderId
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create checkout session';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const redirectToCheckout = async (data: CheckoutSessionData): Promise<CheckoutResult> => {
    const result = await createCheckoutSession(data);
    
    if (!result.success || !result.url) {
      return result;
    }

    try {
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: result.sessionId!
      });

      if (error) {
        throw new Error(error.message);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to redirect to checkout';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    loading,
    error,
    createCheckoutSession,
    redirectToCheckout,
    clearError,
    setError
  };
};
