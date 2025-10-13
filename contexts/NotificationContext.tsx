'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';
import { apiFetch } from '@/lib/api';

interface NotificationData {
  newOrders: number;
  newMessages: number;
  lastChecked: Date;
}

interface NotificationContextType {
  notifications: NotificationData;
  isLoading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markOrdersAsRead: () => void;
  markMessagesAsRead: () => void;
  playNotificationSound: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { currentUser, isShopOwner, isAdmin, session } = useUser();
  const [notifications, setNotifications] = useState<NotificationData>({
    newOrders: 0,
    newMessages: 0,
    lastChecked: new Date()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [lastNotificationCount, setLastNotificationCount] = useState({ orders: 0, messages: 0 });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  // Load sound preference from localStorage
  useEffect(() => {
    const savedSoundPreference = localStorage.getItem('notificationSoundEnabled');
    if (savedSoundPreference !== null) {
      setIsSoundEnabled(JSON.parse(savedSoundPreference));
    }
  }, []);

  // Save sound preference to localStorage
  const toggleSound = useCallback(() => {
    const newValue = !isSoundEnabled;
    setIsSoundEnabled(newValue);
    localStorage.setItem('notificationSoundEnabled', JSON.stringify(newValue));
  }, [isSoundEnabled]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!isSoundEnabled) return;
    
    try {
      // Create a more distinctive notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a two-tone notification sound
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      // Play two tones: first higher, then lower (like a doorbell)
      const now = audioContext.currentTime;
      playTone(800, now, 0.2);
      playTone(600, now + 0.15, 0.2);
      
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, [isSoundEnabled]);

  // Fetch notification counts
  const fetchNotifications = useCallback(async () => {
    if (!currentUser || (!isShopOwner && !isAdmin) || !session?.access_token) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const currentTime = new Date();
      const lastCheck = lastCheckTime || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24 hours ago if no previous check

      const [ordersResponse, messagesResponse] = await Promise.all([
        apiFetch('/api/orders?status=pending&limit=100', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }),
        apiFetch('/api/contact?status=new&limit=100', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
      ]);

      let totalOrdersCount = 0;
      let totalMessagesCount = 0;
      let newOrdersCount = 0;
      let newMessagesCount = 0;

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const orders = ordersData.data || [];
        totalOrdersCount = orders.length;
        
        // Count orders created since last check
        newOrdersCount = orders.filter((order: any) => {
          const orderDate = new Date(order.createdAt);
          return orderDate > lastCheck;
        }).length;
      }

      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        const messages = messagesData.data || [];
        totalMessagesCount = messages.length;
        
        // Count messages created since last check
        newMessagesCount = messages.filter((message: any) => {
          const messageDate = new Date(message.createdAt);
          return messageDate > lastCheck;
        }).length;
      }

      const newNotificationData = {
        newOrders: totalOrdersCount,
        newMessages: totalMessagesCount,
        lastChecked: currentTime
      };

      setNotifications(newNotificationData);

      // Play sound only if there are genuinely new notifications since last check
      const totalNewSinceLastCheck = newOrdersCount + newMessagesCount;
      
      // Debug logging
      console.log('Notification check:', {
        isInitialLoad,
        totalNewSinceLastCheck,
        newOrdersCount,
        newMessagesCount,
        lastCheck: lastCheck.toISOString(),
        currentTime: currentTime.toISOString()
      });
      
      // Play sound if:
      // 1. This is not the initial load
      // 2. There are genuinely new notifications since last check
      if (!isInitialLoad && totalNewSinceLastCheck > 0) {
        console.log('Playing notification sound for', totalNewSinceLastCheck, 'new notifications');
        playNotificationSound();
      }

      // Mark as no longer initial load after first fetch
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }

      // Update tracking variables
      setLastNotificationCount({ orders: totalOrdersCount, messages: totalMessagesCount });
      setLastCheckTime(currentTime);

    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, isShopOwner, isAdmin, session, playNotificationSound, lastCheckTime]);

  // Refresh notifications manually
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Mark orders as read (reset count)
  const markOrdersAsRead = useCallback(() => {
    setNotifications(prev => ({
      ...prev,
      newOrders: 0
    }));
    // Reset the last check time to current time so we don't get false positives
    setLastCheckTime(new Date());
  }, []);

  // Mark messages as read (reset count)
  const markMessagesAsRead = useCallback(() => {
    setNotifications(prev => ({
      ...prev,
      newMessages: 0
    }));
    // Reset the last check time to current time so we don't get false positives
    setLastCheckTime(new Date());
  }, []);

  // Set up polling for notifications
  useEffect(() => {
    if (!currentUser || (!isShopOwner && !isAdmin)) {
      return;
    }

    // Initial fetch
    fetchNotifications();

    // Set up polling every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [currentUser, isShopOwner, isAdmin]);

  // Listen for visibility changes to refresh when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentUser && (isShopOwner || isAdmin)) {
        fetchNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUser, isShopOwner, isAdmin]);

  const value: NotificationContextType = {
    notifications,
    isLoading,
    error,
    refreshNotifications,
    markOrdersAsRead,
    markMessagesAsRead,
    playNotificationSound,
    isSoundEnabled,
    toggleSound
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
