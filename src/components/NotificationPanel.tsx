import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationItem } from '@/components/NotificationItem';
import type { NotificationCategory } from '@/types/notification';

interface NotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FilterType = 'all' | 'safety' | 'general';

export function NotificationPanel({ open, onOpenChange }: NotificationPanelProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
    getNotificationsByCategory,
  } = useNotifications();

  const [filter, setFilter] = useState<FilterType>('all');

  const filteredNotifications = React.useMemo(() => {
    if (filter === 'all') {
      return notifications;
    } else if (filter === 'safety') {
      return notifications.filter(n => n.isSafetyAlert);
    } else {
      return notifications.filter(n => !n.isSafetyAlert);
    }
  }, [notifications, filter]);

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all notifications?')) {
      clearAll();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border space-y-4">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="flex-1">
              <SheetTitle className="text-lg font-semibold">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-destructive text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
              </SheetTitle>
            </div>

            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs flex-shrink-0"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
              className="text-xs"
            >
              All
            </Button>
            <Button
              variant={filter === 'safety' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('safety')}
              className="text-xs"
            >
              Safety Alerts
            </Button>
            <Button
              variant={filter === 'general' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('general')}
              className="text-xs"
            >
              General
            </Button>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="link"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-accent mt-2 self-start"
            >
              Mark all as read
            </Button>
          )}
        </SheetHeader>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <span className="text-3xl">🔔</span>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">No notifications yet</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {filter === 'all'
                  ? 'Your notifications will appear here'
                  : filter === 'safety'
                  ? 'No safety alerts at the moment'
                  : 'No general notifications'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
