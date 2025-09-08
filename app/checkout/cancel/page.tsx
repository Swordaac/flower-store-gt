'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CheckoutCancelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const orderId = searchParams.get('order_id');

  const handleContinueShopping = () => {
    router.push('/');
  };

  const handleTryAgain = () => {
    if (orderId) {
      // Redirect to cart or checkout page
      router.push('/cart');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Payment Cancelled</CardTitle>
            <CardDescription>
              Your payment was cancelled. No charges have been made to your account.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {orderId && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Order Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span className="font-mono">{orderId}</span>
                  </div>
                  <div className="text-gray-600">
                    Your order has been saved and you can complete the payment later.
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">What would you like to do?</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Review your cart and try the payment again</li>
                <li>• Continue shopping and add more items</li>
                <li>• Contact support if you need assistance</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleContinueShopping} 
                variant="outline" 
                className="flex-1"
              >
                Continue Shopping
              </Button>
              <Button 
                onClick={handleTryAgain} 
                className="flex-1"
              >
                Try Payment Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
