'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from './UserContext';

interface OrderInfo {
  deliveryOption: 'delivery' | 'pickup';
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
  specialInstructions?: string;
  contactPhone: string;
  contactEmail: string;
}

interface CartItem {
  productId: string;
  name: string;
  price: number; // in cents
  quantity: number;
  image: string;
  selectedSize?: number; // in cents, for size variations (legacy)
  selectedTier?: 'standard' | 'deluxe' | 'premium'; // for tier variations
  orderInfo?: OrderInfo; // delivery/pickup information
}

interface CartContextType {
  // Cart state
  items: CartItem[];
  totalItems: number;
  totalPrice: number; // in cents
  
  // Cart actions
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (productId: string, selectedSize?: number) => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: number) => void;
  clearCart: () => void;
  
  // Cart utilities
  getItemQuantity: (productId: string, selectedSize?: number) => number;
  isInCart: (productId: string, selectedSize?: number) => boolean;
  
  // Order submission
  submitOrder: (shopId: string, deliveryInfo: OrderInfo) => Promise<{ success: boolean; orderId?: string; error?: string }>;
  
  // Stripe checkout
  checkoutWithStripe: (shopId: string, deliveryInfo: OrderInfo) => Promise<{ success: boolean; sessionId?: string; url?: string; orderId?: string; error?: string }>;
  
  // Cart clearing utilities
  clearCartForOrder: (orderId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { currentUser, session } = useUser();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('flower-store-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('flower-store-cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('flower-store-cart', JSON.stringify(items));
  }, [items]);

  // Calculate total items
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  // Calculate total price
  const totalPrice = items.reduce((total, item) => {
    const itemPrice = item.selectedSize || item.price;
    return total + (itemPrice * item.quantity);
  }, 0);

  // Add item to cart
  const addToCart = useCallback((newItem: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.productId === newItem.productId && 
                item.selectedSize === newItem.selectedSize &&
                item.selectedTier === newItem.selectedTier &&
                JSON.stringify(item.orderInfo) === JSON.stringify(newItem.orderInfo)
      );

      if (existingItemIndex > -1) {
        // Update existing item quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, { ...newItem, quantity }];
      }
    });
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((productId: string, selectedSize?: number) => {
    setItems(prevItems => 
      prevItems.filter(
        item => !(item.productId === productId && item.selectedSize === selectedSize)
      )
    );
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((productId: string, quantity: number, selectedSize?: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize);
      return;
    }

    setItems(prevItems => 
      prevItems.map(item => 
        item.productId === productId && item.selectedSize === selectedSize
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeFromCart]);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Clear cart for a specific order (with logging)
  const clearCartForOrder = useCallback((orderId: string) => {
    console.log(`Clearing cart for order: ${orderId}`);
    setItems([]);
  }, []);

  // Get quantity of specific item
  const getItemQuantity = useCallback((productId: string, selectedSize?: number): number => {
    const item = items.find(
      item => item.productId === productId && item.selectedSize === selectedSize
    );
    return item ? item.quantity : 0;
  }, [items]);

  // Check if item is in cart
  const isInCart = useCallback((productId: string, selectedSize?: number): boolean => {
    return items.some(
      item => item.productId === productId && item.selectedSize === selectedSize
    );
  }, [items]);

  // Submit order to API
  const submitOrder = useCallback(async (shopId: string, deliveryInfo: OrderInfo): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    try {
      if (items.length === 0) {
        return { success: false, error: 'Cart is empty' };
      }

      if (!currentUser || !session?.access_token) {
        return { success: false, error: 'Please sign in to place an order' };
      }

      // Prepare order data in the format expected by the API
      const orderData = {
        shopId,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        delivery: {
          method: deliveryInfo.deliveryOption,
          ...(deliveryInfo.deliveryOption === 'delivery' && {
            address: deliveryInfo.address,
            deliveryTime: deliveryInfo.deliveryTime
          }),
          ...(deliveryInfo.deliveryOption === 'pickup' && {
            pickupTime: deliveryInfo.pickupTime,
            pickupLocationId: deliveryInfo.pickupLocationId
          }),
          contactPhone: deliveryInfo.contactPhone,
          contactEmail: deliveryInfo.contactEmail,
          specialInstructions: deliveryInfo.specialInstructions || ''
        }
      };

      const response = await fetch('http://localhost:5001/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (result.success) {
        // Clear cart on successful order
        clearCart();
        return { 
          success: true, 
          orderId: result.data._id || result.data.orderNumber 
        };
      } else {
        return { 
          success: false, 
          error: result.error || 'Failed to create order' 
        };
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      return { 
        success: false, 
        error: 'Network error. Please try again.' 
      };
    }
  }, [items, currentUser, session, clearCart]);

  // Checkout with Stripe
  const checkoutWithStripe = useCallback(async (shopId: string, deliveryInfo: OrderInfo): Promise<{ success: boolean; sessionId?: string; url?: string; orderId?: string; error?: string }> => {
    try {
      if (items.length === 0) {
        return { success: false, error: 'Cart is empty' };
      }

      if (!currentUser || !session?.access_token) {
        return { success: false, error: 'Please sign in to place an order' };
      }

      // Prepare order data for Stripe checkout
      const orderData = {
        shopId,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        delivery: {
          method: deliveryInfo.deliveryOption,
          ...(deliveryInfo.deliveryOption === 'delivery' && {
            address: deliveryInfo.address,
            deliveryTime: deliveryInfo.deliveryTime
          }),
          ...(deliveryInfo.deliveryOption === 'pickup' && {
            pickupTime: deliveryInfo.pickupTime,
            pickupLocationId: deliveryInfo.pickupLocationId
          }),
          contactPhone: deliveryInfo.contactPhone,
          contactEmail: deliveryInfo.contactEmail,
          specialInstructions: deliveryInfo.specialInstructions || ''
        },
        notes: `Order from cart with ${items.length} items`
      };

      console.log('CartContext - Prepared order data:', JSON.stringify(orderData, null, 2));

      const response = await fetch('http://localhost:5001/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (result.success) {
        // Note: Cart will be cleared on the success page when payment is confirmed
        // This ensures cart is cleared even if user doesn't reach success page
        console.log('Stripe checkout session created successfully, order ID:', result.orderId);
        return { 
          success: true, 
          sessionId: result.sessionId,
          url: result.url,
          orderId: result.orderId
        };
      } else {
        return { 
          success: false, 
          error: result.error || 'Failed to create checkout session' 
        };
      }
    } catch (error) {
      console.error('Error creating Stripe checkout session:', error);
      return { 
        success: false, 
        error: 'Network error. Please try again.' 
      };
    }
  }, [items, currentUser, session]);

  const value: CartContextType = useMemo(() => ({
    items,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    isInCart,
    submitOrder,
    checkoutWithStripe,
    clearCartForOrder
  }), [
    items,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    isInCart,
    submitOrder,
    checkoutWithStripe,
    clearCartForOrder
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
