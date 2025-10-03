'use client';

import React from 'react';
import { useNotifications } from '@/contexts/NotificationContext';

interface NotificationBadgeProps {
  type: 'orders' | 'messages';
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  type, 
  className = '' 
}) => {
  const { notifications } = useNotifications();
  
  const count = type === 'orders' ? notifications.newOrders : notifications.newMessages;
  
  if (count === 0) {
    return null;
  }

  return (
    <span className={`
      absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 
      text-xs font-bold leading-none text-white bg-red-500 rounded-full
      min-w-[18px] h-[18px] animate-pulse
      ${className}
    `}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

interface NotificationIconProps {
  icon: React.ComponentType<{ className?: string }>;
  type: 'orders' | 'messages';
  className?: string;
  onClick?: () => void;
}

export const NotificationIcon: React.FC<NotificationIconProps> = ({ 
  icon: Icon, 
  type, 
  className = '',
  onClick 
}) => {
  return (
    <div 
      className={`relative inline-block ${onClick ? 'cursor-pointer hover:text-indigo-600' : ''}`}
      onClick={onClick}
    >
      <Icon className={className} />
      <NotificationBadge type={type} />
    </div>
  );
};
