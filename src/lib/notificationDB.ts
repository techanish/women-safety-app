import { getDB } from './offlineDB';
import type { Notification } from '@/types/notification';

const STORE_NAME = 'notifications';
const MAX_NOTIFICATIONS = 500;

export async function saveNotification(notification: Notification): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  await store.put(notification);
  await tx.done;

  // Cleanup old notifications if limit exceeded
  await cleanupOldNotifications();
}

export async function loadAllNotifications(): Promise<Notification[]> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('by-timestamp');

    // Load all notifications sorted by timestamp (newest first)
    const notifications = await index.getAll();
    await tx.done;

    return notifications.reverse();
  } catch (error) {
    console.error('Failed to load notifications:', error);
    return [];
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const notification = await store.get(id);
  if (notification) {
    notification.read = true;
    await store.put(notification);
  }

  await tx.done;
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const notifications = await store.getAll();
  for (const notification of notifications) {
    notification.read = true;
    await store.put(notification);
  }

  await tx.done;
}

export async function deleteNotification(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  await store.delete(id);
  await tx.done;
}

export async function clearAllNotifications(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  await store.clear();
  await tx.done;
}

async function cleanupOldNotifications(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('by-timestamp');

  const count = await store.count();

  if (count > MAX_NOTIFICATIONS) {
    // Get all keys sorted by timestamp
    const keys = await index.getAllKeys();

    // Delete oldest notifications (keys are already sorted)
    const keysToDelete = keys.slice(MAX_NOTIFICATIONS);
    for (const key of keysToDelete) {
      await store.delete(key);
    }
  }

  await tx.done;
}

export async function getNotificationCount(): Promise<{ total: number; unread: number }> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const total = await store.count();

    // Count unread notifications
    const unreadIndex = store.index('by-read');
    const unreadKeys = await unreadIndex.getAllKeys(IDBKeyRange.only(false));

    await tx.done;

    return { total, unread: unreadKeys.length };
  } catch (error) {
    console.error('Failed to get notification count:', error);
    return { total: 0, unread: 0 };
  }
}
