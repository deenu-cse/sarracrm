"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markRead(notification._id);
    }
    setIsOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'APPROVED': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'REJECTED': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'SUBMITTED': return <FileText className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-blue-200 hover:text-white rounded-full hover:bg-navy-light transition-colors focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 border-2 border-navy rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                className="text-xs text-navy hover:text-navy-light font-medium flex items-center"
              >
                <Check className="w-3 h-3 mr-1" /> Mark all read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1 max-h-96">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                No new notifications
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.slice(0, 5).map((notification) => (
                  <div 
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 ${!notification.isRead ? 'border-l-4 border-l-navy bg-blue-50/30' : ''}`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium text-slate-800 ${!notification.isRead ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="px-4 py-2 border-t border-slate-100 text-center bg-slate-50">
            <button 
              onClick={() => {
                setIsOpen(false);
                router.push('/dashboard/notifications');
              }}
              className="text-sm text-navy hover:underline font-medium"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
