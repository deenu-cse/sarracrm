"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { LanguageToggle } from '@/contexts/LanguageContext';
import { AppSidebar, RAIL_WIDTH, SIDEBAR_WIDTH } from './AppSidebar';
import { Breadcrumb } from './Breadcrumb';
import { NotificationBell } from './NotificationBell';

const COLLAPSED_KEY = 'sarra.sidebar.collapsed';

/**
 * Frame of every signed-in page: the sidebar on the left, and a slim strip on
 * top that says where you are and holds the language switch and the
 * notification bell. All links live in the sidebar.
 */
export function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSED_KEY) === '1'); } catch { /* storage unavailable */ }
  }, []);
  const toggleCollapsed = useCallback(() => setCollapsed((value) => {
    try { localStorage.setItem(COLLAPSED_KEY, value ? '0' : '1'); } catch { /* storage unavailable */ }
    return !value;
  }), []);

  return (
    <div className="min-h-screen bg-slate-100/70">
      <AppSidebar mobileOpen={mobileOpen} onMobileClose={closeMobile} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      <div className="app-content flex min-h-screen flex-col transition-[padding] duration-200" style={{ '--rail': `${collapsed ? RAIL_WIDTH : SIDEBAR_WIDTH}px` }}>
        <header className="sticky top-0 z-30 flex h-14 flex-shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur sm:px-6 print:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 md:hidden">
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1"><Breadcrumb /></div>
          <LanguageToggle tone="light" />
          <NotificationBell />
        </header>
        <main className="w-full flex-1">{children}</main>
      </div>
    </div>
  );
}
