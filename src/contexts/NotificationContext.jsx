"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, accessToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  const pollIntervalRef = useRef(null);

  const fetchNotifications = useCallback(async (limit = 5, unreadOnly = true) => {
    if (!isAuthenticated || !accessToken) return;
    try {
      const res = await fetch(`${API_URL}/notifications?unread=${unreadOnly}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include'
      });
      
      if (!res.ok) {
        // Silently ignore 404s if notifications route is not yet implemented
        return;
      }
      
      try {
        const data = await res.json();
        if (data.success) {
          if (unreadOnly && limit === 1) {
            setUnreadCount(data.pagination?.total || 0);
          } else {
            setNotifications(data.data);
            if (data.pagination) setUnreadCount(data.pagination.total);
          }
        }
      } catch (parseError) {
        // Ignore JSON parse errors if backend returned HTML (e.g. 404 page)
        console.warn('Failed to parse notifications response');
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  }, [isAuthenticated, accessToken, API_URL]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(1, true); // initial poll for unread count
      pollIntervalRef.current = setInterval(() => {
        fetchNotifications(1, true);
      }, 60000); // 60s
    } else {
      setUnreadCount(0);
      setNotifications([]);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isAuthenticated, fetchNotifications]);

  const markRead = async (id) => {
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include'
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include'
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, fetchNotifications, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
