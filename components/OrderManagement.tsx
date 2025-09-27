'use client';

import React, { useState } from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  TruckIcon, 
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

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
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'shipped' | 'delivered' | 'cancelled';
  delivery: {
    method: 'pickup' | 'delivery';
    address?: {
      street: string;
      city: string;
      state: string;
      postal: string;
      country: string;
    };
    instructions?: string;
    estimatedDelivery?: Date;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderManagementProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: Order['status']) => void;
  onClose: () => void;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: ClockIcon,
    description: 'Order received, waiting for confirmation'
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircleIcon,
    description: 'Order confirmed, preparing to process'
  },
  preparing: {
    label: 'Preparing',
    color: 'bg-purple-100 text-purple-800',
    icon: ClockIcon,
    description: 'Order is being prepared'
  },
  ready: {
    label: 'Ready',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircleIcon,
    description: 'Order is ready for pickup/delivery'
  },
  shipped: {
    label: 'Shipped',
    color: 'bg-indigo-100 text-indigo-800',
    icon: TruckIcon,
    description: 'Order is on its way'
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircleIcon,
    description: 'Order has been delivered'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800',
    icon: XCircleIcon,
    description: 'Order has been cancelled'
  }
};

const nextStatusMap: Record<Order['status'], Array<Order['status']>> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['shipped', 'delivered'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
};

export const OrderManagement: React.FC<OrderManagementProps> = ({
  order,
  onStatusUpdate,
  onClose
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(order.notes || '');

  const handleStatusUpdate = (newStatus: Order['status']) => {
    onStatusUpdate(order._id, newStatus);
  };

  const handleSaveNotes = () => {
    // Here you would typically call an API to update the notes
    console.log('Saving notes:', editedNotes);
    setIsEditing(false);
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
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

  const currentStatusConfig = statusConfig[order.status];
  const StatusIcon = currentStatusConfig.icon;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Order #{order.orderNumber}
            </h2>
            <p className="text-gray-600 mt-1">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Order Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Order Status</h3>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentStatusConfig.color}`}>
                  <StatusIcon className="h-4 w-4 mr-2" />
                  {currentStatusConfig.label}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{currentStatusConfig.description}</p>
              
              {/* Status Update Buttons */}
              {nextStatusMap[order.status].length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Update Status:</p>
                  <div className="flex flex-wrap gap-2">
                    {nextStatusMap[order.status].map((status) => {
                      const config = statusConfig[status];
                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(status)}
                          className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                            status === 'cancelled' 
                              ? 'bg-red-600 hover:bg-red-700' 
                              : 'bg-indigo-600 hover:bg-indigo-700'
                          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                        >
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-gray-500 text-sm">IMG</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(item.total)}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(item.price)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Order Notes</h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    rows={3}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Add notes about this order..."
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveNotes}
                      className="px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditedNotes(order.notes || '');
                        setIsEditing(false);
                      }}
                      className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">
                  {order.notes || 'No notes added yet.'}
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 text-sm">👤</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {order.customerName || 'Customer'}
                    </p>
                    <p className="text-sm text-gray-500">{order.customerEmail}</p>
                  </div>
                </div>
                
                {order.customerPhone && (
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{order.customerPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <TruckIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {order.delivery.method}
                  </span>
                </div>
                
                {order.delivery.address && (
                  <div className="flex items-start space-x-3">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="text-sm text-gray-600">
                      <p>{order.delivery.address.street}</p>
                      <p>{order.delivery.address.city}, {order.delivery.address.state} {order.delivery.address.postal}</p>
                      <p>{order.delivery.address.country}</p>
                    </div>
                  </div>
                )}
                
                {order.delivery.instructions && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Delivery Instructions:</p>
                    <p className="text-sm text-gray-600">{order.delivery.instructions}</p>
                  </div>
                )}
                
                {order.delivery.estimatedDelivery && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Estimated Delivery:</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(order.delivery.estimatedDelivery.toString())}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="text-gray-900">{formatCurrency(order.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span className="text-gray-900">{formatCurrency(order.deliveryFee)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-gray-900">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
