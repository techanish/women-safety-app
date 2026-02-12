import type { Location } from './safety';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export type NotificationCategory = 'sos' | 'safezone' | 'location' | 'route' | 'checkin' | 'voice' | 'general';

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  isSafetyAlert: boolean;
  metadata?: {
    location?: Location;
    alertId?: string;
    googleMapsUrl?: string;
  };
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  deleteNotification: (id: string) => void;
  getNotificationsByCategory: (category: NotificationCategory | 'all') => Notification[];
}
