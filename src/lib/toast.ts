import { toast as sonnerToast, type ExternalToast } from 'sonner';
import type { NotificationType, NotificationCategory } from '@/types/notification';

// We'll use a module-level store for the addNotification function
// This will be set by the NotificationProvider
let addNotificationFn: ((notification: any) => void) | null = null;

export function setAddNotification(fn: (notification: any) => void) {
  addNotificationFn = fn;
}

function determineCategoryAndSafety(message: string): { category: NotificationCategory; isSafetyAlert: boolean } {
  const msg = message.toLowerCase();

  // SOS-related
  if (msg.includes('sos') || msg.includes('emergency') || msg.includes('alert')) {
    return { category: 'sos', isSafetyAlert: true };
  }

  // Safe zone-related
  if (msg.includes('safe zone') || msg.includes('safe mode') || msg.includes('entered') || msg.includes('left')) {
    return { category: 'safezone', isSafetyAlert: true };
  }

  // Location-related
  if (msg.includes('location') || msg.includes('shared') || msg.includes('sms')) {
    return { category: 'location', isSafetyAlert: true };
  }

  // Route-related
  if (msg.includes('route') || msg.includes('waypoint') || msg.includes('deviat')) {
    return { category: 'route', isSafetyAlert: true };
  }

  // Voice detection
  if (msg.includes('voice') || msg.includes('keyword') || msg.includes('detected')) {
    return { category: 'voice', isSafetyAlert: true };
  }

  // Check-in
  if (msg.includes('check') || msg.includes('safe')) {
    return { category: 'checkin', isSafetyAlert: true };
  }

  return { category: 'general', isSafetyAlert: false };
}

function getTitleFromType(type: NotificationType): string {
  const titles = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
    loading: 'Loading',
  };
  return titles[type];
}

function trackNotification(type: NotificationType, message: string) {
  if (addNotificationFn) {
    const { category, isSafetyAlert } = determineCategoryAndSafety(message);

    addNotificationFn({
      type,
      category,
      title: getTitleFromType(type),
      message,
      isSafetyAlert,
    });
  }
}

export const toast = {
  success: (message: string, data?: ExternalToast) => {
    trackNotification('success', message);
    return sonnerToast.success(message, data);
  },

  error: (message: string, data?: ExternalToast) => {
    trackNotification('error', message);
    return sonnerToast.error(message, data);
  },

  warning: (message: string, data?: ExternalToast) => {
    trackNotification('warning', message);
    return sonnerToast.warning(message, data);
  },

  info: (message: string, data?: ExternalToast) => {
    trackNotification('info', message);
    return sonnerToast.info(message, data);
  },

  loading: (message: string, data?: ExternalToast) => {
    trackNotification('loading', message);
    return sonnerToast.loading(message, data);
  },

  // For backward compatibility with other sonner methods
  promise: sonnerToast.promise,
  custom: sonnerToast.custom,
  message: sonnerToast.message,
  dismiss: sonnerToast.dismiss,
};
