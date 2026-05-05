"use client";
import React, { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, XCircle, FileText, Bell, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function OfficerNotificationsPage() {
  const { notifications, markRead, markAllRead, fetchNotifications, unreadCount, loading } = useNotifications();
  const router = useRouter();

  useEffect(() => {
    fetchNotifications(50, false); // Fetch full list (read and unread) on mount
  }, [fetchNotifications]);

  const getIcon = (type) => {
    switch (type) {
      case 'APPROVED': return <div className="p-2 bg-green-100 rounded-full text-green-600"><CheckCircle2 className="w-5 h-5" /></div>;
      case 'REJECTED': return <div className="p-2 bg-red-100 rounded-full text-red-600"><XCircle className="w-5 h-5" /></div>;
      case 'SUBMITTED': return <div className="p-2 bg-blue-100 rounded-full text-blue-600"><FileText className="w-5 h-5" /></div>;
      default: return <div className="p-2 bg-slate-100 rounded-full text-slate-600"><Bell className="w-5 h-5" /></div>;
    }
  };

  const handleClick = (notification) => {
    if (!notification.isRead) {
      markRead(notification._id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
          <p className="text-slate-500">You have {unreadCount} unread messages</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllRead} variant="secondary" size="sm">
            <Check className="w-4 h-4 mr-2" /> Mark all as read
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-800">No notifications</h3>
            <p className="text-slate-500 mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <div 
                key={notification._id}
                onClick={() => handleClick(notification)}
                className={`p-5 hover:bg-slate-50 cursor-pointer transition-colors flex gap-4 ${!notification.isRead ? 'bg-blue-50/20' : ''}`}
              >
                <div className="flex-shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-base font-medium text-slate-800 ${!notification.isRead ? 'font-bold' : ''}`}>
                      {notification.title}
                    </p>
                    <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                      {notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) : ''}
                    </span>
                  </div>
                  <p className={`text-sm ${!notification.isRead ? 'text-slate-700' : 'text-slate-500'}`}>
                    {notification.message}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="flex-shrink-0 flex items-center">
                    <div className="w-2.5 h-2.5 bg-navy rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
