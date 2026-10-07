"use client";
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationsRoute } from '@/constants/nav';
import { NotificationRow } from '@/components/notifications/NotificationParts';

/** Bell with the unread count. Opening it shows the newest notifications in a box. */
export function NotificationBell() {
  const { user } = useAuth();
  const { latest, unreadCount, loading, error, loadLatest, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const buttonRef = useRef(null);
  const router = useRouter();
  const allHref = notificationsRoute(user?.role);

  useEffect(() => {
    if (!open) return undefined;
    loadLatest(8);
    const onPointer = (event) => { if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false); };
    const onKey = (event) => { if (event.key === 'Escape') { setOpen(false); buttonRef.current?.focus(); } };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [open, loadLatest]);

  const openItem = (notification) => {
    if (!notification.isRead) markRead(notification._id);
    setOpen(false);
    if (notification.link) router.push(notification.link);
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`relative rounded-lg border p-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 ${open ? 'border-navy bg-navy/5 text-navy' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
      >
        <Bell className={`h-4 w-4 ${unreadCount ? 'motion-safe:animate-[bell-nudge_2.4s_ease-in-out_1]' : ''}`} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-bold tabular-nums text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="Notifications" className="wz-fade-in absolute right-0 z-50 mt-2 flex max-h-[min(34rem,80vh)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications {unreadCount > 0 && <span className="ml-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white">{unreadCount}</span>}</p>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1 rounded text-xs font-semibold text-navy hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" /> Mark all read
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading && latest.length === 0 && (
              <div className="space-y-3 p-4" role="status" aria-label="Loading notifications">
                {[0, 1, 2].map((n) => <div key={n} className="flex gap-3"><div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-slate-100" /><div className="flex-1 space-y-2"><div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" /><div className="h-3 w-full animate-pulse rounded bg-slate-100" /></div></div>)}
              </div>
            )}
            {!loading && error && <p role="alert" className="px-4 py-6 text-center text-sm text-red-700">{error}</p>}
            {!loading && !error && latest.length === 0 && (
              <div className="px-4 py-10 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400" aria-hidden="true"><Bell className="h-5 w-5" /></span>
                <p className="mt-3 text-sm font-semibold text-slate-800">No notifications yet</p>
                <p className="text-xs text-slate-500">Updates on your projects and reports appear here.</p>
              </div>
            )}
            {latest.length > 0 && (
              <ul className="divide-y divide-slate-100">
                {latest.map((notification) => <li key={notification._id}><NotificationRow notification={notification} onOpen={openItem} compact /></li>)}
              </ul>
            )}
          </div>

          <Link href={allHref} onClick={() => setOpen(false)} className="border-t border-slate-100 px-4 py-2.5 text-center text-sm font-semibold text-navy transition-colors hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50">
            See all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
