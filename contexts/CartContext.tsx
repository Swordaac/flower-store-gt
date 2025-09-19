'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from './UserContext';

interface OrderInfo {
  deliveryOption: 'delivery' | 'pickup';
  // Recipient information (required)
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
  // Common fields (required)
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
      // Validate cart
      if (items.length === 0) {
        return { success: false, error: 'Cart is empty' };
      }

      // Validate authentication
      if (!currentUser || !session?.access_token) {
        return { success: false, error: 'Please sign in to place an order' };
      }

      // Validate required recipient information
      if (!deliveryInfo.recipient?.name || !deliveryInfo.recipient?.phone || !deliveryInfo.recipient?.email) {
        return { success: false, error: 'Recipient name, phone, and email are required' };
      }

      // Validate required contact information
      if (!deliveryInfo.contactPhone || !deliveryInfo.contactEmail) {
        return { success: false, error: 'Contact phone and email are required' };
      }

      // Validate delivery/pickup specific fields
      if (deliveryInfo.deliveryOption === 'delivery') {
        if (!deliveryInfo.delivery?.date || !deliveryInfo.delivery?.time) {
          return { success: false, error: 'Delivery date and time are required' };
        }
        if (!deliveryInfo.delivery?.address?.street || !deliveryInfo.delivery?.address?.city ||
            !deliveryInfo.delivery?.address?.province || !deliveryInfo.delivery?.address?.postalCode) {
          return { success: false, error: 'Complete delivery address is required' };
        }
      } else if (deliveryInfo.deliveryOption === 'pickup') {
        if (!deliveryInfo.pickup?.date || !deliveryInfo.pickup?.time) {
          return { success: false, error: 'Pickup date and time are required' };
        }
      }

      // Prepare order data in the format expected by the API
      const orderData = {
        shopId,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedTier: item.selectedTier,
          selectedSize: item.selectedSize,
          price: item.selectedSize || item.price
        })),
        // Move recipient to root level
        recipient: {
          name: deliveryInfo.recipient.name.trim(),
          phone: deliveryInfo.recipient.phone.trim(),
          email: deliveryInfo.recipient.email.trim()
        },
        // Optional fields at root level
        occasion: deliveryInfo.occasion || '',
        cardMessage: deliveryInfo.cardMessage || '',
        // Delivery information
        delivery: {
          method: deliveryInfo.deliveryOption,
          contactPhone: deliveryInfo.contactPhone,
          contactEmail: deliveryInfo.contactEmail,
          specialInstructions: deliveryInfo.specialInstructions || '',
          // For delivery orders
          ...(deliveryInfo.deliveryOption === 'delivery' && deliveryInfo.delivery && {
            address: {
              company: deliveryInfo.delivery.address.company || '',
              street: deliveryInfo.delivery.address.street,
              city: deliveryInfo.delivery.address.city,
              province: deliveryInfo.delivery.address.province,
              postalCode: deliveryInfo.delivery.address.postalCode,
              country: deliveryInfo.delivery.address.country || 'Canada'
            },
            date: deliveryInfo.delivery.date,
            time: deliveryInfo.delivery.time,
            instructions: deliveryInfo.delivery.instructions || '',
            buzzerCode: deliveryInfo.delivery.buzzerCode || ''
          }),
          // For pickup orders
          ...(deliveryInfo.deliveryOption === 'pickup' && deliveryInfo.pickup && {
            date: deliveryInfo.pickup.date,
            time: deliveryInfo.pickup.time,
            storeAddress: deliveryInfo.pickup.storeAddress || '1208 Crescent St, Montreal, Quebec H3G 2A9'
          })
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
      // Validate cart
      if (items.length === 0) {
        return { success: false, error: 'Cart is empty' };
      }

      // Validate authentication
      if (!currentUser || !session?.access_token) {
        return { success: false, error: 'Please sign in to place an order' };
      }

      // Validate required recipient information
      if (!deliveryInfo.recipient?.name || !deliveryInfo.recipient?.phone || !deliveryInfo.recipient?.email) {
        return { success: false, error: 'Recipient name, phone, and email are required' };
      }

      // Validate required contact information
      if (!deliveryInfo.contactPhone || !deliveryInfo.contactEmail) {
        return { success: false, error: 'Contact phone and email are required' };
      }

      // Validate delivery/pickup specific fields
      if (deliveryInfo.deliveryOption === 'delivery') {
        if (!deliveryInfo.delivery?.date || !deliveryInfo.delivery?.time) {
          return { success: false, error: 'Delivery date and time are required' };
        }
        if (!deliveryInfo.delivery?.address?.street || !deliveryInfo.delivery?.address?.city ||
            !deliveryInfo.delivery?.address?.province || !deliveryInfo.delivery?.address?.postalCode) {
          return { success: false, error: 'Complete delivery address is required' };
        }
      } else if (deliveryInfo.deliveryOption === 'pickup') {
        if (!deliveryInfo.pickup?.date || !deliveryInfo.pickup?.time) {
          return { success: false, error: 'Pickup date and time are required' };
        }
      }

      // Debug log incoming data
      console.log('=== DEBUG: Checkout Data ===');
      console.log('DeliveryInfo:', JSON.stringify(deliveryInfo, null, 2));
      console.log('Items:', JSON.stringify(items, null, 2));

      // Prepare order data for Stripe checkout
      const orderData = {
        shopId,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedTier: item.selectedTier,
          selectedSize: item.selectedSize,
          price: item.selectedSize || item.price
        })),
        // Move recipient to root level
        recipient: {
          name: deliveryInfo.recipient.name.trim(),
          phone: deliveryInfo.recipient.phone.trim(),
          email: deliveryInfo.recipient.email.trim()
        },
        // Optional fields at root level
        occasion: deliveryInfo.occasion || '',
        cardMessage: deliveryInfo.cardMessage || '',
        // Delivery information
        delivery: {
          method: deliveryInfo.deliveryOption,
          contactPhone: deliveryInfo.contactPhone,
          contactEmail: deliveryInfo.contactEmail,
          specialInstructions: deliveryInfo.specialInstructions || '',
          // For delivery orders
          ...(deliveryInfo.deliveryOption === 'delivery' && deliveryInfo.delivery && {
            address: {
              company: deliveryInfo.delivery.address.company || '',
              street: deliveryInfo.delivery.address.street,
              city: deliveryInfo.delivery.address.city,
              province: deliveryInfo.delivery.address.province,
              postalCode: deliveryInfo.delivery.address.postalCode,
              country: deliveryInfo.delivery.address.country || 'Canada'
            },
            date: deliveryInfo.delivery.date,
            time: deliveryInfo.delivery.time,
            instructions: deliveryInfo.delivery.instructions || '',
            buzzerCode: deliveryInfo.delivery.buzzerCode || ''
          }),
          // For pickup orders
          ...(deliveryInfo.deliveryOption === 'pickup' && deliveryInfo.pickup && {
            date: deliveryInfo.pickup.date,
            time: deliveryInfo.pickup.time,
            storeAddress: deliveryInfo.pickup.storeAddress || '1208 Crescent St, Montreal, Quebec H3G 2A9'
          })
        },
        notes: `Order from cart with ${items.length} items`
      };

      console.log('=== DEBUG: Final Payload ===');
      console.log('Full orderData:', JSON.stringify(orderData, null, 2));
      // Note: recipient is on root, not inside delivery
      console.log('Recipient Info:', JSON.stringify(orderData.recipient, null, 2));
      console.log('Delivery Method:', orderData.delivery.method);

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
