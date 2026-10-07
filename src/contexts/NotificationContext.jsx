"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '@/lib/axiosInstance';
import { useAuth } from './AuthContext';

/**
 * Notifications of the signed-in user.
 *
 * The unread count and the list are separate things: the count is polled so
 * the bell stays current, the latest notifications are loaded when the box is
 * opened. (Earlier the list was never loaded, so the box stayed empty while
 * the bell showed a number.)
 */
const NotificationContext = createContext(null);
const POLL_MS = 60000;

const list = async (params) => {
  const query = new URLSearchParams(params).toString();
  const { data: body } = await axiosInstance.get(`/notifications?${query}`);
  return { items: Array.isArray(body?.data) ? body.data : [], pagination: body?.pagination || null };
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, accessToken } = useAuth();
  const ready = Boolean(isAuthenticated && accessToken);
  const [latest, setLatest] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const readyRef = useRef(ready);
  readyRef.current = ready;

  /** Unread count only (cheap; used for polling). */
  const refreshCount = useCallback(async () => {
    if (!readyRef.current) return;
    try {
      const { pagination } = await list({ unread: 'true', limit: 1 });
      setUnreadCount(pagination?.total || 0);
    } catch { /* keep the last known count */ }
  }, []);

  /** The newest notifications, read and unread, for the bell's box. */
  const loadLatest = useCallback(async (limit = 8) => {
    if (!readyRef.current) return;
    setLoading(true);
    setError('');
    try {
      const [{ items }] = await Promise.all([list({ limit }), refreshCount()]);
      setLatest(items);
    } catch {
      setError('Unable to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [refreshCount]);

  /** One page of the full list, for the notifications page. */
  const fetchPage = useCallback(({ page = 1, limit = 20, unreadOnly = false } = {}) => list({ page, limit, ...(unreadOnly ? { unread: 'true' } : {}) }), []);

  useEffect(() => {
    if (!ready) { setLatest([]); setUnreadCount(0); return undefined; }
    refreshCount();
    const timer = setInterval(refreshCount, POLL_MS);
    const onFocus = () => refreshCount();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, [ready, refreshCount]);

  const markRead = useCallback(async (id) => {
    // Show it as read at once; the count is corrected from the server afterwards.
    setLatest((current) => current.map((item) => (item._id === id && !item.isRead ? { ...item, isRead: true } : item)));
    setUnreadCount((current) => Math.max(0, current - 1));
    try { await axiosInstance.patch(`/notifications/${id}/read`, {}); } catch { /* corrected by the refresh below */ }
    refreshCount();
  }, [refreshCount]);

  const markAllRead = useCallback(async () => {
    setLatest((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    try { await axiosInstance.patch('/notifications/read-all', {}); } catch { /* corrected by the refresh below */ }
    refreshCount();
  }, [refreshCount]);

  const value = useMemo(() => ({ latest, unreadCount, loading, error, loadLatest, refreshCount, fetchPage, markRead, markAllRead }),
    [latest, unreadCount, loading, error, loadLatest, refreshCount, fetchPage, markRead, markAllRead]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
