import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, Loader2, Trash2 } from 'lucide-react';
import type { Notification } from '@/types/notification';
import { Button } from '@/components/ui/button';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function getIcon(type: Notification['type']) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    loading: <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />,
  };
  return icons[type];
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        group relative cursor-pointer rounded-lg p-4 transition-all
        ${notification.isSafetyAlert
          ? notification.read
            ? 'bg-destructive/10 hover:bg-destructive/15'
            : 'bg-destructive/20 hover:bg-destructive/25 border-l-4 border-destructive'
          : notification.read
          ? 'bg-muted/30 hover:bg-muted/50'
          : 'bg-accent/10 hover:bg-accent/20 border-l-4 border-accent'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-sm font-medium ${notification.read ? 'text-muted-foreground' : 'text-foreground font-semibold'}`}>
                {notification.title}
              </p>
              <p className={`text-sm mt-0.5 ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                {notification.message}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              onClick={handleDelete}
              title="Delete notification"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">{getTimeAgo(notification.timestamp)}</span>
            {notification.isSafetyAlert && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-medium">
                Safety Alert
              </span>
            )}
            {!notification.read && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-accent/20 text-accent font-medium">
                New
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
