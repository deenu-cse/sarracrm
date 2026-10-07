"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { ActionButton, Notice, RetryButton, Skeleton } from '@/components/projects/create/parts';
import { NotificationRow } from './NotificationParts';

const PAGE = 20;
const FILTERS = [{ id: 'all', label: 'All' }, { id: 'unread', label: 'Unread' }];

const dayStart = (value) => { const date = new Date(value); return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(); };
const groupOf = (value) => {
  const days = Math.round((dayStart(Date.now()) - dayStart(value)) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return 'Earlier this week';
  return 'Older';
};

/** Every notification of the signed-in user, newest first, grouped by day. Shared by all roles. */
export function NotificationsPage() {
  const { unreadCount, fetchPage, markRead, markAllRead, refreshCount } = useNotifications();
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [box, setBox] = useState({ items: [], page: 0, pages: 1, total: 0, loading: true, more: false, error: '' });
  const requestRef = useRef(0);

  const load = useCallback((page, replace) => {
    const requestId = ++requestRef.current;
    setBox((current) => ({ ...current, loading: replace, more: !replace, error: '' }));
    fetchPage({ page, limit: PAGE, unreadOnly: filter === 'unread' })
      .then(({ items, pagination }) => {
        if (requestRef.current !== requestId) return;
        setBox((current) => ({ items: replace ? items : [...current.items, ...items], page, pages: pagination?.pages || 1, total: pagination?.total || 0, loading: false, more: false, error: '' }));
      })
      .catch(() => { if (requestRef.current === requestId) setBox((current) => ({ ...current, loading: false, more: false, error: 'Unable to load notifications. Please try again.' })); });
  }, [fetchPage, filter]);

  useEffect(() => { load(1, true); refreshCount(); }, [load, refreshCount]);

  const open = (notification) => {
    if (!notification.isRead) {
      markRead(notification._id);
      setBox((current) => ({ ...current, items: current.items.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item)) }));
    }
    if (notification.link) router.push(notification.link);
  };
  const readAll = async () => {
    await markAllRead();
    setBox((current) => ({ ...current, items: filter === 'unread' ? [] : current.items.map((item) => ({ ...item, isRead: true })), total: filter === 'unread' ? 0 : current.total }));
  };

  const groups = [];
  box.items.forEach((item) => {
    const name = groupOf(item.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.name === name) last.items.push(item); else groups.push({ name, items: [item] });
  });

  return (
    <div className="mx-auto max-w-4xl p-4 pb-16 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy" aria-hidden="true"><Bell className="h-5 w-5" /></span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
            <p className="text-sm text-slate-500" aria-live="polite">{unreadCount > 0 ? `${unreadCount} unread` : 'You have read everything.'}</p>
          </div>
        </div>
        <ActionButton variant="secondary" size="sm" icon={CheckCheck} onClick={readAll} disabled={unreadCount === 0} disabledReason="Nothing is unread">Mark all read</ActionButton>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <div role="tablist" aria-label="Filter notifications" className="flex gap-1.5">
            {FILTERS.map((item) => (
              <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} onClick={() => setFilter(item.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 ${filter === item.id ? 'border-navy bg-navy text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                {item.label}{item.id === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
              </button>
            ))}
          </div>
          {!box.loading && box.total > 0 && <p className="text-xs text-slate-500">Showing {box.items.length} of {box.total}</p>}
        </header>

        {box.loading && <div className="space-y-3 p-5" role="status" aria-label="Loading notifications">{[0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-16" />)}</div>}
        {!box.loading && box.error && <div className="p-5"><Notice tone="error" action={<RetryButton onClick={() => load(1, true)} />}>{box.error}</Notice></div>}
        {!box.loading && !box.error && box.items.length === 0 && (
          <div className="px-5 py-14 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400" aria-hidden="true"><Bell className="h-6 w-6" /></span>
            <p className="mt-3 text-sm font-semibold text-slate-800">{filter === 'unread' ? 'Nothing unread' : 'No notifications yet'}</p>
            <p className="text-sm text-slate-500">{filter === 'unread' ? 'You are up to date.' : 'Updates on your projects and reports appear here.'}</p>
          </div>
        )}
        {!box.loading && groups.map((group) => (
          <div key={group.name}>
            <h2 className="border-b border-slate-100 bg-slate-50/70 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{group.name}</h2>
            <ul className="divide-y divide-slate-100">
              {group.items.map((notification) => <li key={notification._id}><NotificationRow notification={notification} onOpen={open} /></li>)}
            </ul>
          </div>
        ))}
        {!box.loading && box.page < box.pages && (
          <div className="border-t border-slate-100 p-4 text-center">
            <ActionButton variant="secondary" size="sm" loading={box.more} onClick={() => load(box.page + 1, false)}>{box.more ? 'Loading…' : 'Show older'}</ActionButton>
          </div>
        )}
      </section>
      <p className="mt-3 text-xs text-slate-500">Notifications are kept for 90 days.</p>
    </div>
  );
}
