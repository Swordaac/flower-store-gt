'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  productId: string;
  name: string;
  price: number; // in cents
  quantity: number;
  image: string;
  selectedSize?: number; // in cents, for size variations
}

interface CartContextType {
  // Cart state
  items: CartItem[];
  totalItems: number;
  totalPrice: number; // in cents
  
  // Cart actions
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (productId: string, selectedSize?: number) => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: number) => void;
  clearCart: () => void;
  
  // Cart utilities
  getItemQuantity: (productId: string, selectedSize?: number) => number;
  isInCart: (productId: string, selectedSize?: number) => boolean;
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
  const addToCart = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.productId === newItem.productId && 
                item.selectedSize === newItem.selectedSize
      );

      if (existingItemIndex > -1) {
        // Update existing item quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += 1;
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, { ...newItem, quantity: 1 }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (productId: string, selectedSize?: number) => {
    setItems(prevItems => 
      prevItems.filter(
        item => !(item.productId === productId && item.selectedSize === selectedSize)
      )
    );
  };

  // Update item quantity
  const updateQuantity = (productId: string, quantity: number, selectedSize?: number) => {
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
  };

  // Clear entire cart
  const clearCart = () => {
    setItems([]);
  };

  // Get quantity of specific item
  const getItemQuantity = (productId: string, selectedSize?: number): number => {
    const item = items.find(
      item => item.productId === productId && item.selectedSize === selectedSize
    );
    return item ? item.quantity : 0;
  };

  // Check if item is in cart
  const isInCart = (productId: string, selectedSize?: number): boolean => {
    return items.some(
      item => item.productId === productId && item.selectedSize === selectedSize
    );
  };

  const value: CartContextType = {
    items,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    isInCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
