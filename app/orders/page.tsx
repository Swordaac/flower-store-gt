"use client";

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerId: string;
  shopId: {
    _id: string;
    name: string;
    'address.city': string;
    'address.state': string;
  };
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  total: number;
  status: string;
  delivery: {
    method: 'delivery' | 'pickup';
    address?: any;
    deliveryTime?: string;
    pickupTime?: string;
    contactPhone: string;
    contactEmail: string;
    specialInstructions?: string;
  };
  payment: {
    status: string;
    method: string;
    paidAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function OrdersPage() {
  const { currentUser, session, loading: userLoading } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!session?.access_token || userLoading) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('http://localhost:5001/api/orders', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setOrders(data.data || []);
        } else {
          setError('Failed to fetch orders');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [session, userLoading]);

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)} CAD`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (userLoading || loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600">Loading orders...</span>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
              <p className="mt-2 text-gray-600">
                View and track your flower orders
              </p>
            </div>
            
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="mt-2"
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Order History</h3>
                </div>
                
                <div className="p-6">
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start shopping to see your orders here.
                    </p>
                    <div className="mt-6">
                      <a
                        href="/"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Start Shopping
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <Card key={order._id} className="shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Order #{order.orderNumber || order._id.slice(-8)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {order.shopId.name} • {order.shopId['address.city']}, {order.shopId['address.state']}
                          </p>
                          <p className="text-sm text-gray-500">
                            Placed on {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <p className="text-lg font-medium text-gray-900 mt-1">
                            {formatPrice(order.total)}
                          </p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Items</h4>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {item.name} × {item.quantity}
                              </span>
                              <span className="text-gray-900">
                                {formatPrice(item.total)}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="text-gray-900">{formatPrice(order.subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax</span>
                            <span className="text-gray-900">{formatPrice(order.taxAmount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Delivery Fee</span>
                            <span className="text-gray-900">{formatPrice(order.deliveryFee)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-medium">
                            <span className="text-gray-900">Total</span>
                            <span className="text-gray-900">{formatPrice(order.total)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Delivery Information</h4>
                        <div className="text-sm text-gray-600">
                          <p><strong>Method:</strong> {order.delivery.method === 'delivery' ? 'Delivery' : 'Pickup'}</p>
                          <p><strong>Contact:</strong> {order.delivery.contactPhone} • {order.delivery.contactEmail}</p>
                          {order.delivery.specialInstructions && (
                            <p><strong>Special Instructions:</strong> {order.delivery.specialInstructions}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
