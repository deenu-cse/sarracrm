"use client";
import React from 'react';
import { AlarmClock, Bell, CheckCircle2, FileText, Lock, RotateCcw, XCircle } from 'lucide-react';

/** How a notification looks: icon and colour follow what happened. */
export const lookOf = (notification) => {
  const status = notification.status || '';
  const title = (notification.title || '').toLowerCase();
  if (notification.type === 'REMINDER') return { Icon: AlarmClock, cls: /overdue|waited|stuck/.test(title) ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600', label: 'Reminder' };
  if (/closed$/.test(title)) return { Icon: Lock, cls: 'bg-slate-100 text-slate-600', label: 'Closure' };
  if (status === 'REJECTED') return { Icon: XCircle, cls: 'bg-red-50 text-red-600', label: 'Rejected' };
  if (status === 'RETURNED_TO_PIA' || /returned/.test(title)) return { Icon: RotateCcw, cls: 'bg-amber-50 text-amber-600', label: 'Returned' };
  if (['SANCTIONED', 'APPROVED', 'DISTRICT_APPROVED', 'STATE_VERIFIED', 'PIA_ACCEPTED', 'DISTRICT_ACCEPTED'].includes(status) || /approved|verified|accepted/.test(title)) return { Icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-600', label: 'Approved' };
  if (notification.relatedResource === 'ProjectMPR' || /mpr|report/.test(title)) return { Icon: FileText, cls: 'bg-sky-50 text-sky-600', label: 'Report' };
  return { Icon: Bell, cls: 'bg-navy/10 text-navy', label: 'Update' };
};

export const timeAgo = (value) => {
  if (!value) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** One notification as a button: opens what it is about and marks it read. */
export function NotificationRow({ notification, onOpen, compact = false }) {
  const look = lookOf(notification);
  const unread = !notification.isRead;
  const meta = [notification.referenceNo, notification.actorName && `by ${notification.actorName}`].filter(Boolean).join(' · ');
  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={`group relative flex w-full items-start gap-3 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy/40 ${compact ? 'px-4 py-3' : 'px-5 py-4'} ${unread ? 'bg-sky-50/40' : ''}`}
    >
      {unread && <span className="absolute inset-y-0 left-0 w-1 bg-navy" aria-hidden="true" />}
      <span className={`mt-0.5 flex flex-shrink-0 items-center justify-center rounded-full ${compact ? 'h-8 w-8' : 'h-10 w-10'} ${look.cls}`} aria-hidden="true">
        <look.Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className={`text-sm text-slate-900 ${unread ? 'font-semibold' : 'font-medium'}`}>{notification.title}</span>
          <span className="flex-shrink-0 whitespace-nowrap pt-0.5 text-xs text-slate-400">{timeAgo(notification.createdAt)}</span>
        </span>
        <span className={`mt-0.5 block text-sm text-slate-600 ${compact ? 'line-clamp-2' : ''}`}>{notification.message}</span>
        {!compact && meta && <span className="mt-1 block text-xs text-slate-400">{meta}</span>}
        {notification.priority === 'HIGH' && unread && <span className="mt-1.5 inline-block rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">Needs action</span>}
      </span>
      {unread && <span className="sr-only">Unread</span>}
    </button>
  );
}
