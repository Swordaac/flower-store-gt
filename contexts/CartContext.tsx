'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
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
  isUpdating: boolean; // Track async operations
  
  // Cart actions
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => Promise<boolean>;
  removeFromCart: (productId: string, selectedSize?: number, selectedTier?: 'standard' | 'deluxe' | 'premium') => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: number, selectedTier?: 'standard' | 'deluxe' | 'premium') => void;
  clearCart: () => void;
  
  // Cart utilities
  getItemQuantity: (productId: string, selectedSize?: number, selectedTier?: 'standard' | 'deluxe' | 'premium') => number;
  isInCart: (productId: string, selectedSize?: number, selectedTier?: 'standard' | 'deluxe' | 'premium') => boolean;
  
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
  const [isUpdating, setIsUpdating] = useState(false);
  const { currentUser, session } = useUser();

  // Helper: validate items against server stock (disabled - stock is infinite)
  const validateItemsAgainstStock = useCallback(async (itemsToValidate: CartItem[]): Promise<CartItem[]> => {
    // Stock validation disabled - always return items as-is since stock is infinite
    return itemsToValidate;
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('flower-store-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Validate against server on initial load to clamp stale quantities
        validateItemsAgainstStock(parsedCart).then(clamped => setItems(clamped));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('flower-store-cart');
      }
    }
  }, [validateItemsAgainstStock]);

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

  // Add item to cart (server-validated)
  const addToCart = useCallback(async (newItem: Omit<CartItem, 'quantity'>, quantity: number = 1): Promise<boolean> => {
    try {
      console.log('🛒 Adding to cart:', {
        product: {
          id: newItem.productId,
          name: newItem.name,
          tier: newItem.selectedTier
        },
        quantity,
        currentCartSize: items.length
      });
      
      setIsUpdating(true);
      const prevItems = items;
      const existingItemIndex = prevItems.findIndex(
        item => item.productId === newItem.productId && 
                item.selectedSize === newItem.selectedSize &&
                item.selectedTier === newItem.selectedTier &&
                JSON.stringify(item.orderInfo) === JSON.stringify(newItem.orderInfo)
      );

      const draft = [...prevItems];
      if (existingItemIndex > -1) {
        draft[existingItemIndex] = { ...draft[existingItemIndex], quantity: draft[existingItemIndex].quantity + quantity };
      } else {
        draft.push({ ...newItem, quantity });
      }
      // Validate the updated specific line against server
      const toValidate = existingItemIndex > -1 ? [draft[existingItemIndex]] : [draft[draft.length - 1]];
      const [clamped] = await validateItemsAgainstStock(toValidate);
      console.log('🔄 Stock validation result:', {
        productId: newItem.productId,
        requestedQty: quantity,
        clampedQty: clamped?.quantity,
        success: !!clamped && clamped.quantity > 0
      });
      
      if (!clamped || clamped.quantity === 0) {
        console.warn('❌ Item validation failed or quantity clamped to 0:', {
          productId: newItem.productId,
          tier: newItem.selectedTier,
          requested: quantity
        });
        return false;
      }
      
      // For new items, just add the validated item
      if (existingItemIndex === -1) {
        setItems(current => {
          const updated = [...current, clamped];
          console.log('✅ Cart updated - new item:', {
            previousSize: current.length,
            newSize: updated.length,
            items: updated.map(i => ({
              id: i.productId,
              name: i.name,
              qty: i.quantity,
              tier: i.selectedTier
            }))
          });
          return updated;
        });
      } else {
        // For existing items, update the quantity
        setItems(current => {
          const updated = current.map((it, idx) => 
            idx === existingItemIndex 
              ? { ...it, quantity: it.quantity + clamped.quantity }
              : it
          );
          console.log('✅ Cart updated - existing item:', {
            previousSize: current.length,
            newSize: updated.length,
            items: updated.map(i => ({
              id: i.productId,
              name: i.name,
              qty: i.quantity,
              tier: i.selectedTier
            }))
          });
          return updated;
        });
      }
      return true;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [items, validateItemsAgainstStock]);

  // Remove item from cart
  const removeFromCart = useCallback((productId: string, selectedSize?: number, selectedTier?: 'standard' | 'deluxe' | 'premium') => {
    setItems(prevItems => 
      prevItems.filter(
        item => !(item.productId === productId && item.selectedSize === selectedSize && item.selectedTier === selectedTier)
      )
    );
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((productId: string, quantity: number, selectedSize?: number, selectedTier?: 'standard' | 'deluxe' | 'premium') => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize, selectedTier);
      return;
    }

    setItems(prevItems => {
      const index = prevItems.findIndex(it => it.productId === productId && it.selectedSize === selectedSize && it.selectedTier === selectedTier);
      if (index === -1) return prevItems;
      const next = [...prevItems];
      next[index] = { ...next[index], quantity };
      // Validate just this line
      validateItemsAgainstStock([next[index]]).then(([clamped]) => {
        setItems(current => current.map((it, idx) => idx === index ? (clamped || it) : it).filter(i => i.quantity > 0));
      });
      return prevItems;
    });
  }, [removeFromCart, validateItemsAgainstStock]);

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
  const getItemQuantity = useCallback((productId: string, selectedSize?: number, selectedTier?: 'standard' | 'deluxe' | 'premium'): number => {
    const item = items.find(
      item => item.productId === productId && item.selectedSize === selectedSize && item.selectedTier === selectedTier
    );
    return item ? item.quantity : 0;
  }, [items]);

  // Check if item is in cart
  const isInCart = useCallback((productId: string, selectedSize?: number, selectedTier?: 'standard' | 'deluxe' | 'premium'): boolean => {
    return items.some(
      item => item.productId === productId && item.selectedSize === selectedSize && item.selectedTier === selectedTier
    );
  }, [items]);

  // Handle browser BFCache/pageshow/visibilitychange and window focus to revalidate stock
  useEffect(() => {
    const revalidate = async () => {
      setItems(prev => {
        validateItemsAgainstStock(prev).then(clamped => setItems(clamped));
        return prev;
      });
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) revalidate();
    };
    window.addEventListener('pageshow', onPageShow as any);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') revalidate();
    });
    window.addEventListener('focus', revalidate);
    return () => {
      window.removeEventListener('pageshow', onPageShow as any);
      document.removeEventListener('visibilitychange', revalidate as any);
      window.removeEventListener('focus', revalidate);
    };
  }, [validateItemsAgainstStock]);

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

      const response = await apiFetch('/api/orders', {
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

      const response = await apiFetch('/api/stripe/create-checkout-session', {
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
    isUpdating,
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
    isUpdating,
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
