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

      let newOrdersCount = 0;
      let newMessagesCount = 0;

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        newOrdersCount = ordersData.data?.length || 0;
      }

      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        newMessagesCount = messagesData.data?.length || 0;
      }

      const newNotificationData = {
        newOrders: newOrdersCount,
        newMessages: newMessagesCount,
        lastChecked: new Date()
      };

      setNotifications(newNotificationData);

      // Play sound if there are new notifications
      const totalNew = newOrdersCount + newMessagesCount;
      const totalPrevious = lastNotificationCount.orders + lastNotificationCount.messages;
      
      // Play sound if:
      // 1. This is not the initial load
      // 2. There are new notifications (totalNew > 0)
      // 3. The count has increased from the last check
      if (!isInitialLoad && totalNew > totalPrevious && totalNew > 0) {
        playNotificationSound();
      }

      // Mark as no longer initial load after first fetch
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }

      setLastNotificationCount({ orders: newOrdersCount, messages: newMessagesCount });

    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, isShopOwner, isAdmin, session, playNotificationSound, lastNotificationCount]);

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
    // Update the last count to prevent sound from playing for the same notifications
    setLastNotificationCount(prev => ({
      ...prev,
      orders: 0
    }));
  }, []);

  // Mark messages as read (reset count)
  const markMessagesAsRead = useCallback(() => {
    setNotifications(prev => ({
      ...prev,
      newMessages: 0
    }));
    // Update the last count to prevent sound from playing for the same notifications
    setLastNotificationCount(prev => ({
      ...prev,
      messages: 0
    }));
  }, []);

  // Set up polling for notifications
  useEffect(() => {
    if (!currentUser || (!isShopOwner && !isAdmin)) {
      return;
    }

    // Initial fetch
    fetchNotifications();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [currentUser, isShopOwner, isAdmin, fetchNotifications]);

  // Listen for visibility changes to refresh when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentUser && (isShopOwner || isAdmin)) {
        fetchNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUser, isShopOwner, isAdmin, fetchNotifications]);

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
