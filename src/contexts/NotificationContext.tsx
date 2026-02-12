import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Notification, NotificationContextType, NotificationCategory } from '@/types/notification';
import {
  loadAllNotifications,
  saveNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as dbDeleteNotification,
  clearAllNotifications,
  getNotificationCount,
} from '@/lib/notificationDB';
import { setAddNotification } from '@/lib/toast';

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    const loaded = await loadAllNotifications();
    setNotifications(loaded);
    const count = loaded.filter(n => !n.read).length;
    setUnreadCount(count);
  }, []);

  // Load notifications from IndexedDB on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const addNotification = useCallback(async (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      read: false,
    };

    // Save to IndexedDB
    await saveNotification(newNotification);

    // Update state
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    await markNotificationAsRead(id);

    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );

    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsAsRead();

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(async () => {
    await clearAllNotifications();

    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    await dbDeleteNotification(id);

    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      const updated = prev.filter(n => n.id !== id);

      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }

      return updated;
    });
  }, []);

  const getNotificationsByCategory = useCallback((category: NotificationCategory | 'all') => {
    if (category === 'all') {
      return notifications;
    }

    if (category === 'sos' || category === 'safezone' || category === 'location' || category === 'route' || category === 'voice' || category === 'checkin') {
      // Return all safety-related notifications
      return notifications.filter(n => n.isSafetyAlert);
    }

    return notifications.filter(n => n.category === category);
  }, [notifications]);

  // Register addNotification function with toast wrapper
  useEffect(() => {
    setAddNotification(addNotification);
  }, [addNotification]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
    getNotificationsByCategory,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
