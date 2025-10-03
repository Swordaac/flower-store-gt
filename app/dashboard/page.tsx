'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProductForm } from '@/components/ProductForm';
import { OrderManagement } from '@/components/OrderManagement';
import { AdminShopCreation } from '@/components/AdminShopCreation';
import { PickupLocationManagement } from '@/components/PickupLocationManagement';
import { useUser } from '@/contexts/UserContext';
import { NotificationIcon } from '@/components/NotificationBadge';
import { 
  HomeIcon, 
  CubeIcon, 
  ShoppingCartIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  CogIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  EnvelopeIcon as MailIcon
} from '@heroicons/react/24/outline';
import {
  OverviewTab,
  ShopTab,
  ProductsTab,
  OrdersTab,
  CustomersTab,
  ContactMessagesTab,
  AnalyticsTab,
  AdminTab,
  SettingsTab,
  Product,
  Order
} from './components';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

interface Shop {
  _id: string;
  name: string;
  ownerId: string;
  description?: string;
  phone?: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal: string;
    country: string;
  };
  isActive: boolean;
  createdAt: string;
}

export default function DashboardPage() {
  const { currentUser, userShop, isAdmin, isShopOwner, hasShop, session } = useUser();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showShopCreation, setShowShopCreation] = useState(false);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [shopsLoading, setShopsLoading] = useState(false);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: HomeIcon, show: true },
    { id: 'shop', name: 'My Shop', icon: BuildingStorefrontIcon, show: isShopOwner && hasShop },
    { id: 'products', name: 'Products', icon: CubeIcon, show: isShopOwner && hasShop },
    { id: 'orders', name: 'Orders', icon: ShoppingCartIcon, show: isShopOwner && hasShop },
    { id: 'contact-messages', name: 'Contact Messages', icon: MailIcon, show: isShopOwner && hasShop },
    { id: 'admin', name: 'Admin Panel', icon: CogIcon, show: isAdmin },
    { id: 'settings', name: 'Settings', icon: CogIcon, show: true },
  ];

  useEffect(() => {
    if (currentUser && (isShopOwner || isAdmin)) {
      const requestedShopId = searchParams.get('shop');
      if (isShopOwner && !isAdmin && requestedShopId && requestedShopId !== userShop?._id) {
        console.warn('Shop owner attempted to access different shop data, redirecting to own shop');
        window.history.replaceState({}, '', '/dashboard');
        return;
      }
      fetchDashboardData();
    }
  }, [currentUser, isShopOwner, isAdmin, searchParams, userShop]);

  useEffect(() => {
    if (isAdmin && activeTab === 'admin') {
      fetchAllShops();
    }
  }, [isAdmin, activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (isShopOwner || isAdmin) {
        await Promise.all([
          fetchProducts(),
          fetchOrders()
        ]);
      }
      
      calculateStats();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const shopId = searchParams.get('shop') || userShop?._id;
      
      let url = '/api/products';
      if (isShopOwner && shopId) {
        url = `/api/products/shop/${shopId}`;
      }
      
      const response = await apiFetch(url, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const shopId = searchParams.get('shop') || userShop?._id;
      
      let url = '/api/orders';
      if (isShopOwner && shopId) {
        url = `/api/orders/shop/${shopId}`;
      }
      
      const response = await apiFetch(url, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchAllShops = async () => {
    if (!isAdmin) return;
    
    try {
      setShopsLoading(true);
      const response = await apiFetch('/api/shops/admin/all', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllShops(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setShopsLoading(false);
    }
  };

  const calculateStats = () => {
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    setStats({
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenue
    });
  };

  const handleShopSelect = (shop: Shop) => {
    setSelectedShop(shop);
    const url = new URL(window.location.href);
    url.searchParams.set('shop', shop._id);
    window.history.pushState({}, '', url.toString());
  };

  const handleViewAllShops = () => {
    setSelectedShop(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('shop');
    window.history.pushState({}, '', url.toString());
  };

  const handleProductSubmit = async (productData: any) => {
    try {
      const url = editingProduct 
        ? `/api/products/${editingProduct._id}`
        : '/api/products';
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(productData)
      });

      const responseData = await response.json();

      if (response.ok) {
        await fetchDashboardData();
        setShowProductForm(false);
        setEditingProduct(null);
        
        alert(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
        
        return responseData.data;
      } else {
        const errorMessage = responseData.error || responseData.details || 'Unknown error occurred';
        console.error('Error saving product:', responseData);
        alert(`Error saving product: ${errorMessage}`);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Network error: Please check your connection and try again.');
      throw error;
    }
  };

  const handleProductEdit = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleProductDelete = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await apiFetch(`/api/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        });

        const responseData = await response.json();

        if (response.ok) {
          await fetchDashboardData();
          alert('Product deleted successfully!');
        } else {
          const errorMessage = responseData.error || 'Unknown error occurred';
          console.error('Error deleting product:', responseData);
          alert(`Error deleting product: ${errorMessage}`);
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Network error: Please check your connection and try again.');
      }
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      const response = await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const responseData = await response.json();

      if (response.ok) {
        await fetchDashboardData();
        alert(`Order status updated to ${newStatus} successfully!`);
      } else {
        const errorMessage = responseData.error || 'Unknown error occurred';
        console.error('Error updating order status:', responseData);
        alert(`Error updating order status: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Network error: Please check your connection and try again.');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} onAddProduct={() => setShowProductForm(true)} userShop={userShop} isShopOwner={isShopOwner} />;
      case 'shop':
        return <ShopTab shop={userShop} />;
      case 'products':
        return (
          <ProductsTab 
            products={products}
            loading={loading}
            onAddProduct={() => setShowProductForm(true)}
            onEditProduct={handleProductEdit}
            onDeleteProduct={handleProductDelete}
          />
        );
      case 'orders':
        return (
          <OrdersTab 
            orders={orders}
            loading={loading}
            onViewOrder={setSelectedOrder}
          />
        );

      case 'contact-messages':
        return <ContactMessagesTab userShop={userShop} />;

      case 'admin':
        return (
          <AdminTab 
            onShowShopCreation={() => setShowShopCreation(true)}
            allShops={allShops}
            selectedShop={selectedShop}
            shopsLoading={shopsLoading}
            onShopSelect={handleShopSelect}
            onViewAllShops={handleViewAllShops}
            isAdmin={isAdmin}
          />
        );
      case 'settings':
        return <SettingsTab />;
      default:
        return <OverviewTab stats={stats} onAddProduct={() => setShowProductForm(true)} userShop={userShop} isShopOwner={isShopOwner} />;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white shadow-lg min-h-screen">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
              <p className="text-sm text-gray-600 mt-1">
                {currentUser?.role === 'admin' ? 'Admin Panel' : 
                 currentUser?.role === 'shop_owner' ? 'Shop Management' : 
                 'Customer Dashboard'}
              </p>
              {isShopOwner && userShop && (
                <div className="mt-2 p-2 bg-indigo-50 rounded-md">
                  <p className="text-xs text-indigo-700 font-medium">Viewing: {userShop.name}</p>
                </div>
              )}
              {isAdmin && selectedShop && (
                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-700 font-medium">Admin View: {selectedShop.name}</p>
                </div>
              )}
            </div>
            
            <nav className="px-3">
              {tabs.filter(tab => tab.show).map((tab) => {
                const Icon = tab.icon;
                const isOrdersTab = tab.id === 'orders';
                const isMessagesTab = tab.id === 'contact-messages';
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      // Mark notifications as read when clicking on the tab
                      if (isOrdersTab) {
                        // This will be handled by the NotificationProvider
                      } else if (isMessagesTab) {
                        // This will be handled by the NotificationProvider
                      }
                    }}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="relative mr-3">
                      {isOrdersTab ? (
                        <NotificationIcon 
                          icon={Icon} 
                          type="orders" 
                          className="h-5 w-5"
                        />
                      ) : isMessagesTab ? (
                        <NotificationIcon 
                          icon={Icon} 
                          type="messages" 
                          className="h-5 w-5"
                        />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
              {renderTabContent()}
            </div>
          </div>
        </div>

        {/* Modals */}
        {showProductForm && (
          <ProductForm
            product={editingProduct}
            onSubmit={handleProductSubmit}
            onCancel={() => {
              setShowProductForm(false);
              setEditingProduct(null);
            }}
            isEditing={!!editingProduct}
            shopId={userShop?._id}
          />
        )}

        {selectedOrder && (
          <OrderManagement
            order={selectedOrder}
            onStatusUpdate={handleOrderStatusUpdate}
            onClose={() => setSelectedOrder(null)}
          />
        )}

        {showShopCreation && (
          <AdminShopCreation
            onClose={() => setShowShopCreation(false)}
            onShopCreated={() => {
              setShowShopCreation(false);
              window.location.reload();
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}