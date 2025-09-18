'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { CreditCardIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface StripeCheckoutButtonProps {
  shopId: string;
  deliveryInfo: {
    deliveryOption: 'delivery' | 'pickup';
    // Recipient information
    recipient: {
      name: string;
      phone: string;
      email: string;
    };
    // Optional occasion and card message
    occasion?: string;
    cardMessage?: string;
    // Delivery specific fields
    delivery?: {
      address: {
        company?: string;
        street: string;
        city: string;
        province: string;
        postalCode: string;
        country: string;
      };
      date: string;
      time: string;
      instructions?: string;
      buzzerCode?: string;
    };
    // Pickup specific fields
    pickup?: {
      date: string;
      time: string;
      storeAddress: string;
    };
    // Common fields
    specialInstructions?: string;
    contactPhone: string;
    contactEmail: string;
  };
  className?: string;
  children?: React.ReactNode;
}

export default function StripeCheckoutButton({ 
  shopId, 
  deliveryInfo, 
  className = '',
  children 
}: StripeCheckoutButtonProps) {
  const { checkoutWithStripe } = useCart();
  const { currentUser, session } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const handleCheckout = async () => {
    clearError();
    setIsProcessing(true);

    try {
      // Check authentication first
      if (!currentUser || !session?.access_token) {
        setError('Please sign in to continue with checkout. Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/auth/signin';
        }, 2000);
        setIsProcessing(false);
        return;
      }

      // Validate required fields before proceeding
      // Validate recipient information
      if (!deliveryInfo.recipient.name || !deliveryInfo.recipient.phone || !deliveryInfo.recipient.email) {
        setError('Recipient name, phone, and email are required');
        setIsProcessing(false);
        return;
      }

      // Validate contact information
      if (!deliveryInfo.contactPhone || !deliveryInfo.contactEmail) {
        setError('Contact phone and email are required');
        setIsProcessing(false);
        return;
      }

      if (deliveryInfo.deliveryOption === 'delivery') {
        if (!deliveryInfo.delivery?.address.street || !deliveryInfo.delivery?.address.city || 
            !deliveryInfo.delivery?.address.province || !deliveryInfo.delivery?.address.postalCode) {
          setError('Complete delivery address is required');
          setIsProcessing(false);
          return;
        }
        if (!deliveryInfo.delivery.date || !deliveryInfo.delivery.time) {
          setError('Delivery date and time are required');
          setIsProcessing(false);
          return;
        }
      } else if (deliveryInfo.deliveryOption === 'pickup') {
        if (!deliveryInfo.pickup?.date || !deliveryInfo.pickup?.time) {
          setError('Pickup date and time are required');
          setIsProcessing(false);
          return;
        }
      }

      const result = await checkoutWithStripe(shopId, deliveryInfo);
      
      if (!result.success) {
        console.error('Checkout failed:', result.error);
        
        // Handle specific authentication error
        if (result.error === 'Authentication required') {
          setError('Please sign in to continue with checkout. Redirecting to login...');
          // Redirect to login page after a short delay
          setTimeout(() => {
            window.location.href = '/auth/signin';
          }, 2000);
        } else {
          setError(result.error || 'Checkout failed');
        }
        return;
      }

      // Redirect to Stripe checkout
      if (result.url) {
        window.location.href = result.url;
      } else {
        setError('Failed to get checkout URL');
      }
    } catch (err) {
      console.error('Unexpected error during checkout:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isProcessing;

  return (
    <div className="space-y-2">
      <Button
        onClick={handleCheckout}
        disabled={isLoading}
        className={`w-full ${className}`}
      >
        {isLoading ? (
          <>
            <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCardIcon className="h-4 w-4 mr-2" />
            {children || 'Pay with Stripe'}
          </>
        )}
      </Button>
      
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
