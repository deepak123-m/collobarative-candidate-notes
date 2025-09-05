import { useState, useEffect } from 'react';
import { Bell, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';
import Link from 'next/link';

export default function NotificationList({ notifications }) {
  const [unreadNotifications, setUnreadNotifications] = useState([]);

  useEffect(() => {
    setUnreadNotifications(notifications.filter(n => !n.is_read));
  }, [notifications]);

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setUnreadNotifications(unreadNotifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        <Bell className="mx-auto h-8 w-8 opacity-50" />
        <p className="mt-2">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.slice(0, 5).map((notification) => (
        <div
          key={notification.id}
          className={`p-3 rounded-lg border ${!notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4" />
                <span className="font-medium">{notification.tagged_by_name}</span>
                <span className="mx-1">mentioned you in</span>
                <Link 
                  href={`/candidates/${notification.candidate_id}?highlight=${notification.note_id}`}
                  className="text-primary hover:underline font-medium"
                  onClick={() => markAsRead(notification.id)}
                >
                  {notification.candidate_name}
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {notification.note_message}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {formatDate(notification.note_created_at)}
              </p>
            </div>
            {!notification.is_read && (
              <button
                onClick={() => markAsRead(notification.id)}
                className="text-xs text-primary hover:underline ml-2"
              >
                Mark read
              </button>
            )}
          </div>
        </div>
      ))}
      {notifications.length > 5 && (
        <div className="text-center pt-2">
          <Link href="/notifications" className="text-sm text-primary hover:underline">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}