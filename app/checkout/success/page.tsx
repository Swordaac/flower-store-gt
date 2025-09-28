'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/contexts/UserContext';
import { useCart } from '@/contexts/CartContext';

interface CheckoutSession {
  id: string;
  status: string;
  amount_total: number;
  currency: string;
  customer_email: string;
  payment_status: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session: userSession, loading: userLoading } = useUser();
  const { clearCart, clearCartForOrder } = useCart();
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStable, setSessionStable] = useState(false);
  const [cartCleared, setCartCleared] = useState(false);

  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  // Wait for session to be stable before proceeding
  useEffect(() => {
    if (userLoading) {
      setSessionStable(false);
      return;
    }

    if (userSession?.access_token) {
      // Add a small delay to ensure session is stable
      const timer = setTimeout(() => {
        console.log('Session is now stable:', userSession);
        setSessionStable(true);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setSessionStable(false);
    }
  }, [userSession, userLoading]);

  useEffect(() => {
    console.log('Main useEffect triggered:', {
      sessionId,
      orderId,
      sessionStable,
      hasUserSession: !!userSession,
      hasAccessToken: !!userSession?.access_token
    });

    if (!sessionId || !orderId) {
      setError('Missing session or order information');
      setLoading(false);
      return;
    }

    if (!sessionStable) {
      console.log('Session not stable yet, waiting...');
      return; // Wait for session to be stable
    }

    if (!userSession?.access_token) {
      console.log('No access token found after session is stable');
      setError('Authentication required. Please sign in to view your order.');
      setLoading(false);
      return;
    }

    const fetchSessionDetails = async () => {
      try {
        const response = await apiFetch(`/api/stripe/checkout-session/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${userSession.access_token}`
          }
        });

        const data = await response.json();

        if (data.success) {
          setSession(data.session);
          setOrder(data.order);
          
          // Clear cart when payment is successful
          if (data.session?.payment_status === 'paid' && !cartCleared) {
            console.log('Payment successful, clearing cart...');
            if (data.order?.id) {
              clearCartForOrder(data.order.id);
            } else {
              clearCart();
            }
            setCartCleared(true);
          }
        } else {
          setError(data.error || 'Failed to retrieve session details');
        }
      } catch (err) {
        console.error('Error fetching session details:', err);
        setError('Failed to load session details');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId, orderId, userSession, sessionStable]);

  const handleContinueShopping = () => {
    // Add payment success parameters to ensure cart is cleared
    const url = new URL('/', window.location.origin);
    if (order?.id) {
      url.searchParams.set('payment_success', 'true');
      url.searchParams.set('order_id', order.id);
    }
    router.push(url.toString());
  };

  const handleViewOrders = () => {
    router.push('/orders');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Payment Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={handleContinueShopping} className="w-full">
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaymentSuccessful = session?.payment_status === 'paid';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            {isPaymentSuccessful ? (
              <>
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-green-600">Payment Successful!</CardTitle>
                <CardDescription>
                  Thank you for your order. We'll send you a confirmation email shortly.
                </CardDescription>
              </>
            ) : (
              <>
                <XCircleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <CardTitle className="text-yellow-600">Payment Pending</CardTitle>
                <CardDescription>
                  Your payment is being processed. You'll receive an email once it's confirmed.
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            {order && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Order Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Order Number:</span>
                    <span className="font-mono">{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="capitalize">{order.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-semibold">
                      ${(order.total / 100).toFixed(2)} CAD
                    </span>
                  </div>
                </div>
              </div>
            )}

            {session && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>${(session.amount_total / 100).toFixed(2)} {session.currency.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="capitalize">{session.payment_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span>{session.customer_email}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleContinueShopping} 
                variant="outline" 
                className="flex-1"
              >
                Continue Shopping
              </Button>
              <Button 
                onClick={handleViewOrders} 
                className="flex-1"
              >
                View My Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

