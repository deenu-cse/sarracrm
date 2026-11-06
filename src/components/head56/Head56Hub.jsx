"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ClipboardPlus, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLES, roleLabelOf, workflowRoleOf } from '@/constants/roles';
import { Head56Dashboard } from './Head56Dashboard';
import { Head56Reports } from './Head56Reports';
import { Head56Allocations } from './Head56Allocations';
import { Head56Statement } from './Head56Statement';
import { Head56Master } from './Head56Master';
import { fetchH56Queue } from '@/lib/head56Api';
import { Tabs, currentFy, useH56Base } from './shared';

/**
 * Budget Head 56 — Non-Salary Grant (गैर वेतन हेतु अनुदान), for every role:
 *   SARRA HQ       dashboard, reports, allocations (Maker / Checker / Approver), statement, master
 *   District       its Centre and PIAs: dashboard, reports, allocations (read), statement
 *   PIA            its own reports, allocation and summary
 *   M&E            everything, read-only
 */
export function Head56Hub() {
  const base = useH56Base();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [financialYear, setFinancialYear] = useState(currentFy());
  const [queueCount, setQueueCount] = useState(0);

  const role = user?.role;
  // Reports waiting for this user's step, shown on the tab from the start.
  useEffect(() => {
    if (![USER_ROLES.SUPER_ADMIN, USER_ROLES.DD_LEVEL, USER_ROLES.PIA_OFFICER].includes(role)) return;
    fetchH56Queue({ limit: 1 }).then((result) => setQueueCount(result.total)).catch(() => {});
  }, [role]);
  const isMaker = [USER_ROLES.SUPER_ADMIN, USER_ROLES.DD_LEVEL, USER_ROLES.PIA_OFFICER].includes(role) && workflowRoleOf(user) === 'MAKER';
  const tabs = [
    ...(role === USER_ROLES.PIA_OFFICER ? [] : [{ id: 'dashboard', label: 'Dashboard' }]),
    { id: 'reports', label: 'Monthly Reports', count: queueCount },
    { id: 'allocation', label: role === USER_ROLES.PIA_OFFICER ? 'My Allocation' : 'Allocations' },
    ...(role === USER_ROLES.PIA_OFFICER ? [{ id: 'dashboard', label: 'Summary' }] : []),
    { id: 'statement', label: 'Prarup-2 Statement' },
    ...([USER_ROLES.SUPER_ADMIN, USER_ROLES.MND_SUPER_ADMIN, USER_ROLES.MND_OFFICER].includes(role) ? [{ id: 'master', label: 'Head 56 Master' }] : []),
  ];
  const requested = params.get('tab');
  const tab = tabs.some((t) => t.id === requested) ? requested : tabs[0].id;
  const choose = (id) => router.replace(`${pathname}?tab=${id}`, { scroll: false });

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 pb-16 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy/10 text-navy" aria-hidden="true"><Wallet className="h-5 w-5" /></span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Budget Head 56 — Non-Salary Grant</h1>
            <p className="text-sm text-slate-500">56-गैर वेतन हेतु अनुदान · allocation, monthly physical and financial progress (Prarup-2) · {roleLabelOf(user)}</p>
          </div>
        </div>
        {isMaker && (
          <Link href={`${base}/new`} className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-navy-light hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:ring-offset-2">
            <ClipboardPlus className="h-4 w-4" aria-hidden="true" /> New Monthly Report
          </Link>
        )}
      </header>

      <Tabs tabs={tabs} value={tab} onChange={choose} label="Head 56 sections" />

      {tab === 'dashboard' && <Head56Dashboard financialYear={financialYear} onYearChange={setFinancialYear} />}
      {tab === 'reports' && <Head56Reports financialYear={financialYear} onYearChange={setFinancialYear} isMaker={isMaker} onQueueCount={setQueueCount} />}
      {tab === 'allocation' && <Head56Allocations financialYear={financialYear} onYearChange={setFinancialYear} />}
      {tab === 'statement' && <Head56Statement financialYear={financialYear} onYearChange={setFinancialYear} />}
      {tab === 'master' && <Head56Master />}
    </div>
  );
}
