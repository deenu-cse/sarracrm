"use client";
import React, { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useT } from '@/contexts/LanguageContext';
import { DeadlinesBoard } from './DeadlinesBoard';
import { MonitoringSettings } from './MonitoringSettings';

/** Deadlines for the signed-in role; State and M&E administrators also get the reminder and e-mail settings. */
export function DeadlinesPage() {
  const { user } = useAuth();
  const t = useT();
  const [tab, setTab] = useState('deadlines');
  if (!user?.role) return null;
  const canManage = ['SUPER_ADMIN', 'MND_SUPER_ADMIN'].includes(user.role);
  const tabs = [{ id: 'deadlines', label: 'Deadlines' }, { id: 'settings', label: 'Reminders & E-mail' }];

  return (
    <div className="mx-auto max-w-7xl p-4 pb-16 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy" aria-hidden="true"><CalendarClock className="h-5 w-5" /></span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('Deadlines')}</h1>
          <p className="text-sm text-slate-500">{t('What is due, what is late and what is waiting.')}</p>
        </div>
      </div>

      {canManage && (
        <div className="mb-5 border-b border-slate-200">
          <div role="tablist" aria-label="Deadline views" className="-mb-px flex gap-1">
            {tabs.map((item) => (
              <button key={item.id} type="button" role="tab" id={`deadline-tab-${item.id}`} aria-selected={tab === item.id} aria-controls={`deadline-panel-${item.id}`} onClick={() => setTab(item.id)}
                className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy/40 ${tab === item.id ? 'border-navy text-navy' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'}`}>
                {t(item.label)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div key={tab} role="tabpanel" id={`deadline-panel-${tab}`} aria-labelledby={canManage ? `deadline-tab-${tab}` : undefined} className="wz-fade-in">
        {tab === 'settings' && canManage ? <MonitoringSettings /> : <DeadlinesBoard role={user.role} />}
      </div>
    </div>
  );
}
