'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface CartIconProps {
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const CartIcon: React.FC<CartIconProps> = ({ 
  className = '', 
  style = {}, 
  onClick 
}) => {
  const { totalItems } = useCart();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.location.href = '/cart';
    }
  };

  return (
    <div className="relative">
      <ShoppingCart 
        className={`h-5 w-5 cursor-pointer ${className}`} 
        style={style}
        onClick={handleClick}
      />
      {totalItems > 0 && (
        <span 
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
          style={{ fontSize: '10px' }}
        >
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </div>
  );
};
