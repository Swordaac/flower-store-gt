'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { UserProfile } from '@/components/auth/UserProfile';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { ProductForm } from '@/components/ProductForm';
import { OrderManagement } from '@/components/OrderManagement';
import { AdminShopCreation } from '@/components/AdminShopCreation';
import { PickupLocationManagement } from '@/components/PickupLocationManagement';
import { useUser } from '@/contexts/UserContext';
import { 
  HomeIcon, 
  CubeIcon, 
  ShoppingCartIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  CogIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  BuildingStorefrontIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

interface Product {
  _id: string;
  name: string;
  color: string;
  description: string;
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

interface Order {
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
  const [allShops, setAllShops] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [shopsLoading, setShopsLoading] = useState(false);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: HomeIcon, show: true },
    { id: 'shop', name: 'My Shop', icon: BuildingStorefrontIcon, show: isShopOwner && hasShop },
    { id: 'products', name: 'Products', icon: CubeIcon, show: isShopOwner && hasShop },
    { id: 'orders', name: 'Orders', icon: ShoppingCartIcon, show: isShopOwner && hasShop },
    { id: 'pickup-locations', name: 'Pickup Locations', icon: MapPinIcon, show: isShopOwner && hasShop },
    { id: 'customers', name: 'Customers', icon: UserGroupIcon, show: isShopOwner && hasShop },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon, show: isShopOwner && hasShop },
    { id: 'admin', name: 'Admin Panel', icon: CogIcon, show: isAdmin },
    { id: 'settings', name: 'Settings', icon: CogIcon, show: true },
  ];

  // Fetch dashboard data
  useEffect(() => {
    if (currentUser && (isShopOwner || isAdmin)) {
      // Security check: ensure shop owners can only access their own shop
      const requestedShopId = searchParams.get('shop');
      if (isShopOwner && !isAdmin && requestedShopId && requestedShopId !== userShop?._id) {
        console.warn('Shop owner attempted to access different shop data, redirecting to own shop');
        // Redirect to their own shop dashboard
        window.history.replaceState({}, '', '/dashboard');
        return;
      }
      fetchDashboardData();
    }
  }, [currentUser, isShopOwner, isAdmin, searchParams, userShop]);

  // Fetch all shops when admin tab is active
  useEffect(() => {
    if (isAdmin && activeTab === 'admin') {
      fetchAllShops();
    }
  }, [isAdmin, activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (isShopOwner || isAdmin) {
        // Fetch products and orders for shop owners and admins
        await Promise.all([
          fetchProducts(),
          fetchOrders()
        ]);
      }
      
      // Calculate stats
      calculateStats();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      // Check for shop parameter in URL or use user's shop
      const shopId = searchParams.get('shop') || userShop?._id;
      
      // For shop owners, only fetch products from their own shop
      let url = 'http://localhost:5001/api/products';
      if (isShopOwner && shopId) {
        url = `http://localhost:5001/api/products/shop/${shopId}`;
      }
      
      const response = await fetch(url, {
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
      // Check for shop parameter in URL or use user's shop
      const shopId = searchParams.get('shop') || userShop?._id;
      
      // For shop owners, only fetch orders from their own shop
      let url = 'http://localhost:5001/api/orders';
      if (isShopOwner && shopId) {
        url = `http://localhost:5001/api/orders/shop/${shopId}`;
      }
      
      const response = await fetch(url, {
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
      const response = await fetch('http://localhost:5001/api/shops/admin/all', {
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

  const handleShopSelect = (shop: any) => {
    setSelectedShop(shop);
    // Update URL to show selected shop
    const url = new URL(window.location.href);
    url.searchParams.set('shop', shop._id);
    window.history.pushState({}, '', url.toString());
  };

  const handleViewAllShops = () => {
    setSelectedShop(null);
    // Remove shop parameter from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('shop');
    window.history.pushState({}, '', url.toString());
  };

  const handleProductSubmit = async (productData: any) => {
    try {
      const url = editingProduct 
        ? `http://localhost:5001/api/products/${editingProduct._id}`
        : 'http://localhost:5001/api/products';
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(productData)
      });

      const responseData = await response.json();

      if (response.ok) {
        await fetchDashboardData(); // Refresh all data including stats
        setShowProductForm(false);
        setEditingProduct(null);
        
        // Show success message
        alert(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
        
        // Return the product data so ProductForm can use the ID for image uploads
        return responseData.data;
      } else {
        // Show specific error message from backend
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
        const response = await fetch(`http://localhost:5001/api/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        });

        const responseData = await response.json();

        if (response.ok) {
          await fetchDashboardData(); // Refresh all data including stats
          alert('Product deleted successfully!');
        } else {
          // Show specific error message from backend
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
      const response = await fetch(`http://localhost:5001/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const responseData = await response.json();

      if (response.ok) {
        await fetchDashboardData(); // Refresh all data including stats
        alert(`Order status updated to ${newStatus} successfully!`);
      } else {
        // Show specific error message from backend
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
      case 'pickup-locations':
        return <PickupLocationManagement shopId={userShop?._id} />;
      case 'customers':
        return <CustomersTab />;
      case 'analytics':
        return <AnalyticsTab />;
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
        <Navigation />
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
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
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
              // Refresh user data to show updated role
              window.location.reload();
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

// Overview Tab Component
function OverviewTab({ stats, onAddProduct, userShop, isShopOwner }: { 
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
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <EyeIcon className="h-5 w-5 mr-2" />
            View Orders
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
}

// Shop Tab Component
function ShopTab({ shop }: { shop: any }) {
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
}

function ProductsTab({ 
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
    bestSeller: false
  });
  const [availableFilters, setAvailableFilters] = useState<{
    occasions: any[];
    productTypes: any[];
    colors: string[];
  }>({
    occasions: [],
    productTypes: [],
    colors: []
  });

  // Fetch available filters
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [occasionsRes, productTypesRes] = await Promise.all([
          fetch('http://localhost:5001/api/products/occasions'),
          fetch('http://localhost:5001/api/products/types')
        ]);

        const [occasionsData, productTypesData] = await Promise.all([
          occasionsRes.json(),
          productTypesRes.json()
        ]);

        // Get unique colors from products
        const uniqueColors = Array.from(new Set(products.map(p => p.color))).filter(Boolean);

        setAvailableFilters({
          occasions: occasionsData.data || [],
          productTypes: productTypesData.data || [],
          colors: uniqueColors
        });
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    };

    fetchFilters();
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesOccasions = filters.occasions.length === 0 || 
        product.occasions?.some((o: { _id: string }) => filters.occasions.includes(o._id));
      
      const matchesProductTypes = filters.productTypes.length === 0 || 
        product.productTypes?.some((pt: { _id: string }) => filters.productTypes.includes(pt._id));
      
      const matchesColors = filters.colors.length === 0 || 
        filters.colors.includes(product.color);
      
      const matchesBestSeller = !filters.bestSeller || product.isBestSeller;

      return matchesOccasions && matchesProductTypes && matchesColors && matchesBestSeller;
    });
  }, [products, filters]);

  // Handle filter changes
  const handleFilterChange = (filterType: keyof ProductFilters, value: string) => {
    if (filterType === 'bestSeller') {
      setFilters(prev => ({
        ...prev,
        bestSeller: !prev.bestSeller
      }));
    } else {
      setFilters(prev => {
        const currentValues = prev[filterType] as string[];
        const newValues = currentValues.includes(value)
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value];
        
        return {
          ...prev,
          [filterType]: newValues
        };
      });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      occasions: [],
      productTypes: [],
      colors: [],
      bestSeller: false
    });
  };
  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="mt-2 text-gray-600">
              Manage your product catalog and inventory
            </p>
          </div>
          <button 
            onClick={onAddProduct}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Products Table */}
      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            {(filters.occasions.length > 0 || filters.productTypes.length > 0 || filters.colors.length > 0) && (
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Occasions Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Occasions
            </label>
            <div className="space-y-2">
              {availableFilters.occasions.map(occasion => (
                <label key={occasion._id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.occasions.includes(occasion._id)}
                    onChange={() => handleFilterChange('occasions', occasion._id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">{occasion.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Product Types Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Types
            </label>
            <div className="space-y-2">
              {availableFilters.productTypes.map(type => (
                <label key={type._id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.productTypes.includes(type._id)}
                    onChange={() => handleFilterChange('productTypes', type._id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">{type.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Colors Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Colors
            </label>
            <div className="space-y-2">
              {availableFilters.colors.map(color => (
                <label key={color} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.colors.includes(color)}
                    onChange={() => handleFilterChange('colors', color)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">{color}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Best Seller Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Best Seller
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.bestSeller}
                  onChange={() => setFilters(prev => ({ ...prev, bestSeller: !prev.bestSeller }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">Show only best sellers</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Product List</h3>
            <span className="text-sm text-gray-500">
              {filteredProducts.length} products
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Images
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
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No products found. Add your first product to get started!
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 relative">
                          <img 
                            className="h-10 w-10 rounded-full object-cover" 
                            src={product.images?.[0]?.url || '/placeholder.jpg'} 
                            alt={product.name} 
                          />
                          {product.images?.[0]?.size && (
                            <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full">
                              {product.images[0].size.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-wrap gap-1">
                        {product.productTypes?.map((type) => (
                          <span 
                            key={type._id} 
                            className="px-2 py-1 rounded-full text-xs"
                            style={{ 
                              backgroundColor: type.color + '20', 
                              color: type.color 
                            }}
                          >
                            {type.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500">Standard: ${(product.price?.standard / 100).toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Deluxe: ${(product.price?.deluxe / 100).toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Premium: ${(product.price?.premium / 100).toFixed(2)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="mr-2">{product.stock}</span>
                        <span className="text-xs text-gray-500">({product.color})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className="font-medium">{product.images?.length || 0} images</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.images?.slice(0, 3).map((img, index) => (
                            <span key={index} className="px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              {img.size?.toUpperCase() || 'N/A'}
                            </span>
                          ))}
                          {(product.images?.length || 0) > 3 && (
                            <span className="px-1 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                              +{(product.images?.length || 0) - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => onEditProduct(product)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => onDeleteProduct(product._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
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

// Orders Tab Component
function OrdersTab({ 
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
          Track and manage customer orders
        </p>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Order List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
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
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No orders found. Orders will appear here when customers place them.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customerName || order.customerEmail || 'Customer'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${(order.total / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'ready' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => onViewOrder(order)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <EyeIcon className="h-4 w-4" />
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
function CustomersTab() {
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

// Analytics Tab Component
function AnalyticsTab() {
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
function AdminTab({ 
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
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="mt-2 text-gray-600">
              Manage users, shops, and system settings
            </p>
          </div>
          <button
            onClick={onShowShopCreation}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create New Shop
          </button>
        </div>
      </div>

      {selectedShop ? (
        <ShopDetailsView 
          shop={selectedShop} 
          onBack={onViewAllShops}
        />
      ) : (
        <AllShopsView 
          shops={allShops}
          loading={shopsLoading}
          onShopSelect={onShopSelect}
        />
      )}
    </div>
  );
}

// All Shops View Component
function AllShopsView({ 
  shops, 
  loading, 
  onShopSelect 
}: { 
  shops: any[];
  loading: boolean;
  onShopSelect: (shop: any) => void;
}) {
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading shops...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">All Shops</h3>
        <p className="text-sm text-gray-600">Click on a shop to view its details and manage its data</p>
      </div>
      
      <div className="p-6">
        {shops.length === 0 ? (
          <div className="text-center py-8">
            <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No shops found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new shop.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((shop) => (
              <div
                key={shop._id}
                onClick={() => onShopSelect(shop)}
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 cursor-pointer transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <BuildingStorefrontIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {shop.name}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      shop.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {shop.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {shop.address?.city}, {shop.address?.state}
                  </p>
                  <p className="text-xs text-gray-400">
                    Created: {new Date(shop.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Shop Details View Component
function ShopDetailsView({ 
  shop, 
  onBack 
}: { 
  shop: any;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{shop.name}</h2>
              <p className="text-gray-600">{shop.description || 'No description'}</p>
            </div>
          </div>
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
            shop.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {shop.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Shop Information */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
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
              <p className="mt-1 text-sm text-gray-900">{shop.email || 'No email'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-900">{shop.address?.street}</p>
            <p className="text-sm text-gray-900">
              {shop.address?.city}, {shop.address?.state} {shop.address?.postal}
            </p>
            <p className="text-sm text-gray-900">{shop.address?.country}</p>
          </div>
        </div>
      </div>

      {/* Business Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Business Settings</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <p className="mt-1 text-sm text-gray-900">{shop.currency || 'USD'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tax Rate</label>
            <p className="mt-1 text-sm text-gray-900">{(shop.taxRate * 100).toFixed(1)}%</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Delivery Options</label>
            <p className="mt-1 text-sm text-gray-900">
              {shop.deliveryOptions?.pickup ? 'Pickup' : ''}
              {shop.deliveryOptions?.pickup && shop.deliveryOptions?.delivery ? ', ' : ''}
              {shop.deliveryOptions?.delivery ? 'Delivery' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => window.open(`/dashboard?shop=${shop._id}`, '_blank')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            View Shop Dashboard
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Shop
          </button>
        </div>
      </div>
    </div>
  );
}

// Settings Tab Component
function SettingsTab() {
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
