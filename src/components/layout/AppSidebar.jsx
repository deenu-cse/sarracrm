"use client";
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, X, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useT } from '@/contexts/LanguageContext';
import { navLinksFor } from '@/constants/nav';
import { ROLE_LABELS } from '@/constants/roles';

export const RAIL_WIDTH = 68; // px, the collapsed sidebar (icons only)

/** The link whose address is the longest match for the current page is the active one. */
const activeHref = (links, pathname) => links
  .filter((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
  .sort((a, b) => b.href.length - a.href.length)[0]?.href || null;

const WORKFLOW = { MAKER: 'Maker', CHECKER: 'Checker', APPROVER: 'Approver' };

function NavList({ links, current, expanded, unread, onNavigate }) {
  const t = useT();
  return (
    <ul className="space-y-1 px-3">
      {links.map((link) => {
        const active = link.href === current;
        const badge = link.badge === 'notifications' && unread > 0 ? unread : 0;
        const Icon = link.icon;
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              title={expanded ? undefined : t(link.label)}
              className={`group/link relative flex h-11 items-center rounded-lg text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-white/70
                ${active ? 'bg-white/15 text-white' : 'text-blue-100/80 hover:bg-white/10 hover:text-white'}`}
            >
              {/* Marker of the current page */}
              <span className={`absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-saffron transition-[height,opacity] duration-200 ${active ? 'h-6 opacity-100' : 'h-0 opacity-0'}`} aria-hidden="true" />
              <span className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center">
                <Icon className={`h-5 w-5 transition-transform duration-200 ease-out motion-safe:group-hover/link:-rotate-6 motion-safe:group-hover/link:scale-110 ${active ? 'sb-icon-active' : ''}`} aria-hidden="true" />
                {badge > 0 && !expanded && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-navy bg-red-500" aria-hidden="true" />}
              </span>
              <span className={`min-w-0 flex-1 truncate pr-3 transition-[opacity,transform] duration-200 ${expanded ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0'}`}>{t(link.label)}</span>
              {badge > 0 && expanded && <span className="mr-3 rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white">{badge > 99 ? '99+' : badge}</span>}
              {badge > 0 && <span className="sr-only">, {badge} unread</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Brand({ expanded }) {
  return (
    <Link href="/dashboard" className="flex h-16 flex-shrink-0 items-center gap-1 px-3 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70" aria-label="SARRA CRM, home">
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-white" aria-hidden="true"><Zap className="h-5 w-5" /></span>
      <span className={`flex flex-col whitespace-nowrap transition-[opacity,transform] duration-200 ${expanded ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0'}`}>
        <span className="text-base font-bold leading-none tracking-wide text-white">SARRA</span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-blue-200">CRM Portal</span>
      </span>
    </Link>
  );
}

function UserBlock({ expanded }) {
  const { user, logout } = useAuth();
  if (!user) return null;
  const initials = (user.name || 'U').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const role = `${ROLE_LABELS[user.role] || ''}${WORKFLOW[user.workflowRole] ? ` · ${WORKFLOW[user.workflowRole]}` : ''}`;
  return (
    <div className="flex-shrink-0 border-t border-white/10 p-3">
      <div className="flex h-11 items-center">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center" aria-hidden="true">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-saffron text-sm font-bold text-white">{initials}</span>
        </span>
        <span className={`min-w-0 flex-1 transition-[opacity,transform] duration-200 ${expanded ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0'}`}>
          <span className="block truncate text-sm font-semibold text-white">{user.name}</span>
          <span className="block truncate text-xs text-blue-200">{role}</span>
        </span>
      </div>
      <button
        type="button"
        onClick={logout}
        title={expanded ? undefined : 'Sign out'}
        className="group/link mt-1 flex h-11 w-full items-center rounded-lg text-sm font-medium text-blue-100/80 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center"><LogOut className="h-5 w-5 transition-transform duration-200 motion-safe:group-hover/link:translate-x-0.5" aria-hidden="true" /></span>
        <span className={`whitespace-nowrap transition-[opacity,transform] duration-200 ${expanded ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0'}`}>Sign out</span>
      </button>
    </div>
  );
}

/**
 * Sidebar with every link of the signed-in role.
 *
 * On a desktop it rests as a narrow rail of icons and opens over the page
 * while the pointer (or keyboard focus) is on it, so the page never shifts.
 * On a phone it is a drawer opened from the menu button in the top strip.
 */
export function AppSidebar({ mobileOpen, onMobileClose }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [hovered, setHovered] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const closeTimer = useRef(null);
  const links = navLinksFor(user);
  const current = activeHref(links, pathname || '');
  const expanded = hovered || keyboard;

  useEffect(() => () => clearTimeout(closeTimer.current), []);
  // The drawer closes when a link takes the user to another page.
  useEffect(() => { onMobileClose?.(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') onMobileClose?.(); };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = previous; };
  }, [mobileOpen, onMobileClose]);

  if (!user?.role) return null;

  const enter = () => { clearTimeout(closeTimer.current); setHovered(true); };
  // A short wait before closing, so brushing past the edge does not make it flicker.
  const leave = () => { clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => setHovered(false), 120); };

  return (
    <>
      <aside
        onMouseEnter={enter}
        onMouseLeave={leave}
        onFocus={(event) => { if (event.target.matches?.(':focus-visible')) setKeyboard(true); }}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setKeyboard(false); }}
        aria-label="Main navigation"
        style={{ width: expanded ? 256 : RAIL_WIDTH }}
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden bg-navy transition-[width,box-shadow] duration-200 ease-out md:flex print:hidden ${expanded ? 'shadow-2xl' : 'shadow-md'}`}
      >
        <Brand expanded={expanded} />
        <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-3 [scrollbar-width:none]"><NavList links={links} current={current} expanded={expanded} unread={unreadCount} /></nav>
        <UserBlock expanded={expanded} />
      </aside>

      {/* Phone: drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden print:hidden" role="dialog" aria-modal="true" aria-label="Main navigation">
          <button type="button" aria-label="Close menu" onClick={onMobileClose} className="wz-fade-in absolute inset-0 bg-slate-900/50" />
          <aside className="sb-drawer-in absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-navy shadow-2xl">
            <div className="flex items-center justify-between pr-3">
              <Brand expanded />
              <button type="button" onClick={onMobileClose} aria-label="Close menu" className="rounded-lg p-2 text-blue-100 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"><X className="h-5 w-5" aria-hidden="true" /></button>
            </div>
            <nav className="min-h-0 flex-1 overflow-y-auto py-3"><NavList links={links} current={current} expanded unread={unreadCount} onNavigate={onMobileClose} /></nav>
            <UserBlock expanded />
          </aside>
        </div>
      )}
    </>
  );
}
