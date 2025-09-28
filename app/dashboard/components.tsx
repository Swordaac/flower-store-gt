'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { UserProfile } from '@/components/auth/UserProfile';
import { 
  CubeIcon, 
  ShoppingCartIcon, 
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingStorefrontIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

export interface Product {
  _id: string;
  name: string;
  color: string;
  description: string;
  variants: Array<{
    tierName: 'standard' | 'deluxe' | 'premium';
    price: number;
    stock: number;
    images: Array<{
      size: string;
      url: string;
      alt: string;
      isPrimary: boolean;
    }>;
    isActive: boolean;
  }>;
  price: {
    standard: number;
    deluxe: number;
    premium: number;
  };
  stock: number;
  tags: string[];
  images: Array<{
    size: string;
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  deluxeImage?: {
    url: string;
    alt: string;
  };
  premiumImage?: {
    url: string;
    alt: string;
  };
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  createdAt: string;
  occasions?: Array<{
    _id: string;
    name: string;
    sympathy?: string[];
  }>;
  productTypes?: Array<{
    _id: string;
    name: string;
    color: string;
    icon?: string;
  }>;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }>;
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

// Overview Tab Component
export function OverviewTab({ stats, onAddProduct, userShop, isShopOwner }: { 
  stats: DashboardStats; 
  onAddProduct: () => void;
  userShop: any;
  isShopOwner: boolean;
}) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Here's what's happening with your business today.
        </p>
        {isShopOwner && userShop && (
          <p className="mt-1 text-sm text-indigo-600">
            Showing data for: <span className="font-medium">{userShop.name}</span>
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CubeIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalProducts}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCartIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalOrders}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Orders</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pendingOrders}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">${(stats.totalRevenue / 100).toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button 
            onClick={onAddProduct}
            className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Product
          </button>


        </div>
      </div>
    </div>
  );
}

// Shop Tab Component
export function ShopTab({ shop }: { shop: any }) {
  if (!shop) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Shop</h1>
          <p className="mt-2 text-gray-600">
            You don't have a shop yet. Please contact an admin to create one for you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Shop</h1>
        <p className="mt-2 text-gray-600">
          Manage your shop information and settings
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Shop Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Shop Name</label>
                <p className="mt-1 text-sm text-gray-900">{shop.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">{shop.description || 'No description'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{shop.phone || 'No phone'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{shop.email}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-900">{shop.address.street}</p>
              <p className="text-sm text-gray-900">
                {shop.address.city}, {shop.address.state} {shop.address.postal}
              </p>
              <p className="text-sm text-gray-900">{shop.address.country}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Products Tab Component
interface ProductFilters {
  occasions: string[];
  productTypes: string[];
  colors: string[];
  bestSeller: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  priceTier: 'all' | 'standard' | 'deluxe' | 'premium';
}

export function ProductsTab({ 
  products, 
  loading, 
  onAddProduct, 
  onEditProduct, 
  onDeleteProduct 
}: { 
  products: Product[];
  loading: boolean;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}) {
  const [filters, setFilters] = useState<ProductFilters>({
    occasions: [],
    productTypes: [],
    colors: [],
    bestSeller: false,
    minPrice: null,
    maxPrice: null,
    priceTier: 'all'
  });

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (filters.occasions.length > 0 && !product.occasions?.some(o => filters.occasions.includes(o._id))) {
        return false;
      }
      if (filters.productTypes.length > 0 && !product.productTypes?.some(t => filters.productTypes.includes(t._id))) {
        return false;
      }
      if (filters.colors.length > 0 && !filters.colors.includes(product.color)) {
        return false;
      }
      if (filters.bestSeller && !product.isBestSeller) {
        return false;
      }
      if (filters.minPrice !== null) {
        const minPrice = product.variants[0]?.price || product.price.standard;
        if (minPrice < filters.minPrice) return false;
      }
      if (filters.maxPrice !== null) {
        const maxPrice = product.variants[product.variants.length - 1]?.price || product.price.premium;
        if (maxPrice > filters.maxPrice) return false;
      }
      if (filters.priceTier !== 'all') {
        const variant = product.variants.find(v => v.tierName === filters.priceTier);
        if (!variant || !variant.isActive) return false;
      }
      return true;
    });
  }, [products, filters]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <p className="mt-2 text-gray-600">
          Manage your product catalog
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={onAddProduct}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add New Product
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Product List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
                  const minPrice = Math.min(...product.variants.map(v => v.price));
                  const maxPrice = Math.max(...product.variants.map(v => v.price));
                  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
                  const isLowStock = totalStock <= 5;

                  return (
                    <tr key={product._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {primaryImage ? (
                          <img
                            src={primaryImage.url}
                            alt={primaryImage.alt}
                            className="h-12 w-12 object-cover rounded"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                            <CubeIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.color}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {product.productTypes?.map((type) => (
                            <span
                              key={type._id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                              style={{ backgroundColor: type.color + '20', color: type.color }}
                            >
                              {type.icon} {type.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(minPrice / 100).toFixed(2)} - ${(maxPrice / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          totalStock === 0
                            ? 'bg-red-100 text-red-800'
                            : isLowStock
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {totalStock === 0 ? 'Out of Stock' : `${totalStock} in stock`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {product.isBestSeller && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Best Seller
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => onEditProduct(product)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(product._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Orders Tab Component
export function OrdersTab({ 
  orders, 
  loading, 
  onViewOrder 
}: { 
  orders: Order[];
  loading: boolean;
  onViewOrder: (order: Order) => void;
}) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="mt-2 text-gray-600">
          Manage and track customer orders
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Order List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.customerName || 'Guest'}</div>
                      <div className="text-sm text-gray-500">{order.customerEmail}</div>
                      {order.customerPhone && (
                        <div className="text-sm text-gray-500">{order.customerPhone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.items.map(item => item.name).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${(order.total / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'preparing' ? 'bg-indigo-100 text-indigo-800' :
                        order.status === 'ready' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'shipped' ? 'bg-cyan-100 text-cyan-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.delivery.method === 'pickup' ? 'Pickup' : 'Delivery'}
                      </div>
                      {order.delivery.method === 'delivery' && order.delivery.address && (
                        <div className="text-xs text-gray-500">
                          {order.delivery.address.city}, {order.delivery.address.state}
                        </div>
                      )}
                      {order.delivery.estimatedDelivery && (
                        <div className="text-xs text-gray-500">
                          Est: {new Date(order.delivery.estimatedDelivery).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onViewOrder(order)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Customers Tab Component
export function CustomersTab() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <p className="mt-2 text-gray-600">
          View and manage customer information
        </p>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Customer management features coming soon...</p>
      </div>
    </div>
  );
}

// Contact Messages Tab Component
interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  createdAt: string;
}

export function ContactMessagesTab({ userShop }: { userShop: any }) {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { session } = useUser();

  useEffect(() => {
    fetchMessages();
  }, [userShop]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/contact', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching contact messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (messageId: string, newStatus: string) => {
    try {
      const response = await apiFetch(`/api/contact/${messageId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchMessages(); // Refresh messages
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Contact Messages</h1>
        <p className="mt-2 text-gray-600">
          Manage and respond to customer inquiries
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Message List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Loading messages...
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No messages found.
                  </td>
                </tr>
              ) : (
                messages.map((message) => (
                  <tr 
                    key={message._id}
                    onClick={() => {
                      setSelectedMessage(message);
                      setIsModalOpen(true);
                      if (message.status === 'new') {
                        handleStatusUpdate(message._id, 'read');
                      }
                    }}
                    className="cursor-pointer hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {message.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {message.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {message.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        message.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                        message.status === 'read' ? 'bg-blue-100 text-blue-800' :
                        message.status === 'replied' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {message.status === 'new' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(message._id, 'read');
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Mark as Read"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        )}
                        {message.status !== 'replied' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(message._id, 'replied');
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as Replied"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        {message.status !== 'archived' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(message._id, 'archived');
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Archive"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Detail Modal */}
      {isModalOpen && selectedMessage && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-auto overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Message Details</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedMessage(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">From</label>
                <p className="mt-1 text-sm text-gray-900">{selectedMessage.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{selectedMessage.email}</p>
              </div>
              {selectedMessage.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedMessage.phone}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject</label>
                <p className="mt-1 text-sm text-gray-900">{selectedMessage.subject}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Received</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedMessage.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                  selectedMessage.status === 'read' ? 'bg-blue-100 text-blue-800' :
                  selectedMessage.status === 'replied' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedMessage.status.charAt(0).toUpperCase() + selectedMessage.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              {selectedMessage.status !== 'replied' && (
                <button
                  onClick={() => {
                    handleStatusUpdate(selectedMessage._id, 'replied');
                    setIsModalOpen(false);
                    setSelectedMessage(null);
                  }}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Mark as Replied
                </button>
              )}
              {selectedMessage.status !== 'archived' && (
                <button
                  onClick={() => {
                    handleStatusUpdate(selectedMessage._id, 'archived');
                    setIsModalOpen(false);
                    setSelectedMessage(null);
                  }}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Archive
                </button>
              )}
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedMessage(null);
                }}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Analytics Tab Component
export function AnalyticsTab() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">
          Track your business performance and insights
        </p>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Analytics dashboard coming soon...</p>
      </div>
    </div>
  );
}

// Admin Tab Component
export function AdminTab({ 
  onShowShopCreation, 
  allShops, 
  selectedShop, 
  shopsLoading, 
  onShopSelect, 
  onViewAllShops,
  isAdmin 
}: { 
  onShowShopCreation: () => void;
  allShops: any[];
  selectedShop: any;
  shopsLoading: boolean;
  onShopSelect: (shop: any) => void;
  onViewAllShops: () => void;
  isAdmin: boolean;
}) {
  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div>
      {/* ... [Keep all the existing AdminTab JSX] ... */}
    </div>
  );
}

// Settings Tab Component
export function SettingsTab() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account and business settings
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UserProfile />
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Business Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Name</label>
              <input
                type="text"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter business name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Email</label>
              <input
                type="email"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter business email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter phone number"
              />
            </div>
            <button className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
