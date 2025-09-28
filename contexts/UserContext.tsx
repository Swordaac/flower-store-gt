'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '@/lib/api';

interface Shop {
  _id: string;
  name: string;
  description: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal: string;
    country: string;
  };
  location: {
    type: string;
    coordinates: number[];
  };
  currency: string;
  taxRate: number;
  deliveryOptions: {
    pickup: boolean;
    delivery: boolean;
    deliveryRadius: number;
    deliveryFee: number;
  };
  businessHours: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  supabaseUserId: string;
  email: string;
  name: string;
  role: 'customer' | 'shop_owner' | 'admin';
  avatar?: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserContextType {
  // User data
  currentUser: User | null;
  userShop: Shop | null;
  
  // Session for API calls
  session: any;
  
  // Loading states
  loading: boolean;
  shopLoading: boolean;
  
  // User management functions
  fetchCurrentUser: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<boolean>;
  updateUserRole: (userId: string, newRole: User['role']) => Promise<boolean>;
  
  // Shop management functions
  fetchUserShop: () => Promise<void>;
  createShopForUser: (shopData: any, targetUserId?: string) => Promise<boolean>;
  
  // Admin functions
  fetchAllUsers: () => Promise<User[]>;
  fetchUserById: (userId: string) => Promise<User | null>;
  fetchAllShops: (includeInactive?: boolean) => Promise<Shop[]>;
  fetchAllShopOwners: () => Promise<User[]>;
  createShopByEmail: (shopData: any, userEmail: string) => Promise<boolean>;
  
  // Utility functions
  isAdmin: boolean;
  isShopOwner: boolean;
  hasShop: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { user: authUser, session } = useAuth();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userShop, setUserShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopLoading, setShopLoading] = useState(false);

  // Computed properties
  const isAdmin = currentUser?.role === 'admin';
  const isShopOwner = currentUser?.role === 'shop_owner';
  const hasShop = !!userShop;

  // Fetch current user data
  const fetchCurrentUser = async () => {
    if (!session?.access_token) return;
    
    try {
      setLoading(true);
      const response = await apiFetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.data);
      } else {
        console.error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!session?.access_token) return false;
    
    try {
      const response = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.data);
        return true;
      } else {
        console.error('Failed to update user profile');
        return false;
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  };

  // Update user role (admin only)
  const updateUserRole = async (userId: string, newRole: User['role']): Promise<boolean> => {
    if (!session?.access_token || !isAdmin) return false;
    
    try {
      const response = await apiFetch(`/api/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        // Refresh current user data if it's the same user
        if (userId === currentUser?._id) {
          await fetchCurrentUser();
        }
        return true;
      } else {
        console.error('Failed to update user role');
        return false;
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  };

  // Fetch user's shop
  const fetchUserShop = async () => {
    if (!session?.access_token || !isShopOwner) return;
    
    try {
      setShopLoading(true);
      const response = await apiFetch('/api/shops/my-shop', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserShop(data.data);
      } else if (response.status === 404) {
        setUserShop(null);
      } else {
        console.error('Failed to fetch user shop');
      }
    } catch (error) {
      console.error('Error fetching user shop:', error);
    } finally {
      setShopLoading(false);
    }
  };

  // Create shop for user (admin only)
  const createShopForUser = async (shopData: any, targetUserId?: string): Promise<boolean> => {
    if (!session?.access_token || !isAdmin) return false;
    
    try {
      const endpoint = targetUserId ? '/api/shops' : '/api/shops/create-for-user';
      const body = targetUserId ? { ...shopData, ownerId: targetUserId } : shopData;
      
      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        // If creating shop for current user, refresh shop data
        if (!targetUserId || targetUserId === currentUser?._id) {
          await fetchUserShop();
        }
        return true;
      } else {
        console.error('Failed to create shop');
        return false;
      }
    } catch (error) {
      console.error('Error creating shop:', error);
      return false;
    }
  };

  // Fetch all users (admin only)
  const fetchAllUsers = async (): Promise<User[]> => {
    if (!session?.access_token || !isAdmin) return [];
    
    try {
      const response = await apiFetch('/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      } else {
        console.error('Failed to fetch users');
        return [];
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  // Fetch user by ID (admin only)
  const fetchUserById = async (userId: string): Promise<User | null> => {
    if (!session?.access_token || !isAdmin) return null;
    
    try {
      const response = await apiFetch(`/api/auth/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      } else {
        console.error('Failed to fetch user');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };

  // Fetch all shops (admin only)
  const fetchAllShops = async (includeInactive: boolean = false): Promise<Shop[]> => {
    if (!session?.access_token || !isAdmin) return [];
    
    try {
      const params = new URLSearchParams();
      if (includeInactive) {
        params.append('includeInactive', 'true');
      }
      
      const response = await apiFetch(`/api/shops/admin/all?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      } else {
        console.error('Failed to fetch shops');
        return [];
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      return [];
    }
  };

  // Fetch all shop owners (admin only)
  const fetchAllShopOwners = async (): Promise<User[]> => {
    if (!session?.access_token || !isAdmin) return [];
    
    try {
      const response = await apiFetch('/api/shops/admin/shop-owners', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      } else {
        console.error('Failed to fetch shop owners');
        return [];
      }
    } catch (error) {
      console.error('Error fetching shop owners:', error);
      return [];
    }
  };

  // Create shop for user by email (admin only)
  const createShopByEmail = async (shopData: any, userEmail: string): Promise<boolean> => {
    if (!session?.access_token || !isAdmin) return false;
    
    try {
      const response = await apiFetch('/api/shops/admin/create-by-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ ...shopData, userEmail })
      });

      if (response.ok) {
        return true;
      } else {
        console.error('Failed to create shop by email');
        return false;
      }
    } catch (error) {
      console.error('Error creating shop by email:', error);
      return false;
    }
  };

  // Initialize user data when auth changes
  useEffect(() => {
    if (session?.access_token) {
      fetchCurrentUser();
    } else {
      setCurrentUser(null);
      setUserShop(null);
      setLoading(false);
    }
  }, [session]);

  // Fetch shop data when user becomes shop owner
  useEffect(() => {
    if (currentUser?.role === 'shop_owner' && session?.access_token) {
      fetchUserShop();
    } else {
      setUserShop(null);
    }
  }, [currentUser?.role, session]);

  const value: UserContextType = {
    currentUser,
    userShop,
    session,
    loading,
    shopLoading,
    fetchCurrentUser,
    updateUserProfile,
    updateUserRole,
    fetchUserShop,
    createShopForUser,
    fetchAllUsers,
    fetchUserById,
    fetchAllShops,
    fetchAllShopOwners,
    createShopByEmail,
    isAdmin,
    isShopOwner,
    hasShop
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
