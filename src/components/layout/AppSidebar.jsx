"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronsLeft, ChevronsRight, LogOut, X, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useT } from '@/contexts/LanguageContext';
import { navLinksFor, navMenuFor } from '@/constants/nav';
import { roleLabelOf } from '@/constants/roles';
import { fetchMprQueue } from '@/lib/mprApi';
import { fetchH56Queue } from '@/lib/head56Api';
import { fetchMeetingQueue } from '@/lib/formsApi';

export const SIDEBAR_WIDTH = 272; // px, the open sidebar
export const RAIL_WIDTH = 72; // px, the collapsed sidebar (icons only)

/** Colour of each category's icon chip. */
const TONES = {
  sky: 'bg-sky-400/20 text-sky-200',
  blue: 'bg-blue-400/20 text-blue-200',
  emerald: 'bg-emerald-400/20 text-emerald-200',
  amber: 'bg-amber-400/25 text-amber-200',
  violet: 'bg-violet-400/25 text-violet-200',
  indigo: 'bg-indigo-400/25 text-indigo-200',
  cyan: 'bg-cyan-400/20 text-cyan-200',
  rose: 'bg-rose-400/25 text-rose-200',
};

/** The link whose address is the longest match for the current page is the active one. */
const activeHref = (links, pathname) => links
  .filter((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
  .sort((a, b) => b.href.length - a.href.length)[0]?.href || null;

/**
 * Number of items waiting for the signed-in user (reports to verify, meetings to approve …).
 * Refreshed when the page changes or a notification arrives.
 */
function useQueueCount(fetchQueue, enabled, pathname, unread) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) { setCount(0); return undefined; }
    let current = true;
    fetchQueue({ limit: 1 }).then(({ total }) => { if (current) setCount(total); }).catch(() => { if (current) setCount(0); });
    return () => { current = false; };
  }, [fetchQueue, enabled, pathname, unread]);
  return count;
}

const OPEN_KEY = 'sarra.sidebar.open';
const readOpen = () => { try { return JSON.parse(localStorage.getItem(OPEN_KEY) || '{}') || {}; } catch { return {}; } };

function Count({ value, dot = false }) {
  if (!value) return null;
  if (dot) return <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-navy bg-red-500" aria-hidden="true" />;
  return <span className="ml-auto flex-shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white">{value > 99 ? '99+' : value}</span>;
}

function IconChip({ icon: Icon, tone, active }) {
  return (
    <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${active ? 'bg-white/25 text-white' : TONES[tone] || 'bg-white/10 text-blue-100'}`} aria-hidden="true">
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

/** The menu: categories open and close; the category of the current page is open. */
function Menu({ menu, current, counts, collapsed, onExpand, onNavigate }) {
  const t = useT();
  const [open, setOpen] = useState({});
  useEffect(() => { setOpen(readOpen()); }, []);
  const activeGroup = menu.find((entry) => entry.children?.some((child) => child.href === current))?.label;
  const isOpen = (label) => (open[label] ?? (label === activeGroup));
  const toggle = (label) => setOpen((state) => {
    const next = { ...state, [label]: !isOpen(label) };
    try { localStorage.setItem(OPEN_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
    return next;
  });
  const badgeOf = (link) => counts[link.badge] || 0;

  return (
    <ul className="space-y-1 px-3">
      {menu.map((entry) => {
        if (!entry.children) {
          const active = entry.href === current;
          return (
            <li key={entry.href}>
              <Link
                href={entry.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? t(entry.label) : undefined}
                className={`relative flex min-h-[44px] items-center gap-3 rounded-xl px-2 py-1.5 text-[14px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/70
                  ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40' : 'text-blue-50 hover:bg-white/10'}`}
              >
                <IconChip icon={entry.icon} tone={entry.tone} active={active} />
                {!collapsed && <span className="min-w-0 flex-1 truncate">{t(entry.label)}</span>}
                <Count value={badgeOf(entry)} dot={collapsed} />
              </Link>
            </li>
          );
        }
        const total = entry.children.reduce((sum, child) => sum + badgeOf(child), 0);
        const expanded = isOpen(entry.label) && !collapsed;
        const holdsActive = entry.label === activeGroup;
        const id = `nav-${entry.label.replace(/\W+/g, '-').toLowerCase()}`;
        return (
          <li key={entry.label}>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={id}
              title={collapsed ? t(entry.label) : undefined}
              onClick={() => { if (collapsed) { onExpand?.(); if (!isOpen(entry.label)) toggle(entry.label); } else toggle(entry.label); }}
              className={`relative flex min-h-[44px] w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-[14px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/70
                ${holdsActive ? 'bg-white/10 text-white' : 'text-blue-50 hover:bg-white/10'}`}
            >
              <IconChip icon={entry.icon} tone={entry.tone} active={false} />
              {!collapsed && <span className="min-w-0 flex-1 leading-tight">{t(entry.label)}</span>}
              {!collapsed && total > 0 && !expanded && <Count value={total} />}
              {collapsed && <Count value={total} dot />}
              {!collapsed && <ChevronDown className={`h-4 w-4 flex-shrink-0 text-blue-200 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />}
            </button>
            {expanded && (
              <ul id={id} className="wz-fade-in ml-[22px] mt-1 space-y-0.5 border-l-2 border-white/15 pl-3">
                {entry.children.map((child) => {
                  const active = child.href === current;
                  const Icon = child.icon;
                  return (
                    <li key={child.href + child.label}>
                      <Link
                        href={child.href}
                        onClick={onNavigate}
                        aria-current={active ? 'page' : undefined}
                        className={`relative flex min-h-[38px] items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/70
                          ${active ? 'bg-blue-600 font-bold text-white shadow-md shadow-blue-900/40' : 'font-medium text-blue-100/90 hover:bg-white/10 hover:text-white'}`}
                      >
                        {active && <span className="absolute -left-[15px] top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-saffron" aria-hidden="true" />}
                        <Icon className="h-4 w-4 flex-shrink-0 opacity-90" aria-hidden="true" />
                        <span className="min-w-0 flex-1 leading-tight">{t(child.label)}</span>
                        <Count value={badgeOf(child)} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Brand({ collapsed }) {
  return (
    <Link href="/dashboard" className="flex h-16 flex-shrink-0 items-center gap-3 border-b border-white/10 px-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70" aria-label="SARRA CRM, home">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-saffron to-amber-500 text-white shadow-md" aria-hidden="true"><Zap className="h-5 w-5" /></span>
      {!collapsed && (
        <span className="flex min-w-0 flex-col">
          <span className="text-lg font-extrabold leading-none tracking-wide text-white">SARRA MIS</span>
          <span className="mt-1 truncate text-[10px] font-semibold uppercase tracking-wider text-blue-200">Spring &amp; River Rejuvenation</span>
        </span>
      )}
    </Link>
  );
}

function UserBlock({ collapsed }) {
  const { user, logout } = useAuth();
  if (!user) return null;
  const initials = (user.name || 'U').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="flex-shrink-0 border-t border-white/10 p-3">
      <div className={`flex items-center gap-3 rounded-xl ${collapsed ? 'justify-center' : 'bg-white/5 px-2 py-2'}`}>
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-saffron text-sm font-bold text-white" aria-hidden="true" title={collapsed ? user.name : undefined}>{initials}</span>
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-white">{user.name}</span>
            <span className="block truncate text-xs font-medium text-blue-200">{roleLabelOf(user)}</span>
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={logout}
        title={collapsed ? 'Sign out' : undefined}
        className={`mt-2 flex min-h-[40px] w-full items-center gap-3 rounded-xl px-2 text-sm font-semibold text-blue-100 outline-none transition-colors hover:bg-red-500/20 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 ${collapsed ? 'justify-center' : ''}`}
      >
        <LogOut className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        {!collapsed && 'Sign out'}
      </button>
    </div>
  );
}

/**
 * Sidebar of the signed-in role: categories (Project Management, Monthly Progress,
 * Committees & Campaigns …) that open to show their pages. On a desktop it stays
 * open with labels and can be narrowed to icons; on a phone it is a drawer.
 */
export function AppSidebar({ mobileOpen, onMobileClose, collapsed, onToggleCollapsed }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const menu = navMenuFor(user);
  const links = navLinksFor(user);
  const current = activeHref(links, pathname || '');
  const queue = useQueueCount(fetchMprQueue, links.some((link) => link.badge === 'queue'), pathname, unreadCount);
  const h56 = useQueueCount(fetchH56Queue, links.some((link) => link.badge === 'h56'), pathname, unreadCount);
  // Committee meetings waiting for the HQ Approver (zero for everyone else).
  const meetings = useQueueCount(fetchMeetingQueue, links.some((link) => link.badge === 'meetings') && user?.workflowRole === 'APPROVER', pathname, unreadCount);
  const counts = { notifications: unreadCount, queue, h56, meetings };

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

  return (
    <>
      <aside
        aria-label="Main navigation"
        style={{ width: collapsed ? RAIL_WIDTH : SIDEBAR_WIDTH }}
        className="fixed inset-y-0 left-0 z-40 hidden flex-col bg-gradient-to-b from-[#0b3a5e] via-navy to-[#072a45] shadow-xl transition-[width] duration-200 ease-out md:flex print:hidden"
      >
        <Brand collapsed={collapsed} />
        <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-4 [scrollbar-width:thin]">
          <Menu menu={menu} current={current} counts={counts} collapsed={collapsed} onExpand={onToggleCollapsed} />
        </nav>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Open the sidebar' : 'Narrow the sidebar to icons'}
          title={collapsed ? 'Open the sidebar' : 'Narrow the sidebar'}
          className="mx-3 mb-1 flex h-9 items-center justify-center gap-2 rounded-lg text-xs font-semibold text-blue-200 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" aria-hidden="true" /> : <><ChevronsLeft className="h-4 w-4" aria-hidden="true" /> Narrow sidebar</>}
        </button>
        <UserBlock collapsed={collapsed} />
      </aside>

      {/* Phone: drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden print:hidden" role="dialog" aria-modal="true" aria-label="Main navigation">
          <button type="button" aria-label="Close menu" onClick={onMobileClose} className="wz-fade-in absolute inset-0 bg-slate-900/50" />
          <aside className="sb-drawer-in absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-gradient-to-b from-[#0b3a5e] via-navy to-[#072a45] shadow-2xl">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button type="button" onClick={onMobileClose} aria-label="Close menu" className="rounded-lg p-2 text-blue-100 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"><X className="h-5 w-5" aria-hidden="true" /></button>
            </div>
            <nav className="min-h-0 flex-1 overflow-y-auto py-4">
              <Menu menu={menu} current={current} counts={counts} collapsed={false} onNavigate={onMobileClose} />
            </nav>
            <UserBlock />
          </aside>
        </div>
      )}
    </>
  );
}
