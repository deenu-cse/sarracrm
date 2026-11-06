"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Ban, Check, Clock, RotateCcw, Search, ShieldAlert, UserPlus, Users, UserX, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import { Dialog } from '@/components/ui/Dialog';
import { Pagination } from '@/components/ui/Pagination';
import { ActionButton, Field, Notice, RetryButton, Skeleton, inputClass } from '@/components/projects/create/parts';
import { ROLE_LABELS, USER_ROLES, WORKFLOW_LABELS, roleLabelOf } from '@/constants/roles';
import { approveUser, deactivateUser, fetchUsers, rejectUser, restoreUser, suspendUser } from '@/lib/userApi';

const LIMIT = 15;
const DISTRICT_ROLES = [USER_ROLES.DD_LEVEL, USER_ROLES.PIA_OFFICER];
const ROLE_TONE = {
  SUPER_ADMIN: 'border-purple-200 bg-purple-50 text-purple-800',
  DD_LEVEL: 'border-blue-200 bg-blue-50 text-blue-800',
  PIA_OFFICER: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  MND_SUPER_ADMIN: 'border-slate-300 bg-slate-100 text-slate-800',
  MND_OFFICER: 'border-indigo-200 bg-indigo-50 text-indigo-800',
};

const dateText = (value) => (value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
const statusOf = (user) => {
  if (user.approval?.status === 'PENDING') return 'REQUESTED';
  if (user.approval?.status === 'REJECTED') return 'REQUEST_REJECTED';
  if (user.accountStatus === 'SUSPENDED') return 'SUSPENDED';
  if (user.accountStatus === 'DEACTIVATED' || user.isActive === false) return 'DEACTIVATED';
  if (user.invitePending) return 'INVITED';
  return 'ACTIVE';
};

function StatusCell({ user }) {
  const status = statusOf(user);
  const look = {
    REQUESTED: ['bg-amber-500', 'text-amber-800', 'Awaiting approval', user.approval?.requestedAt && `Requested ${dateText(user.approval.requestedAt)}`],
    REQUEST_REJECTED: ['bg-red-500', 'text-red-800', 'Request rejected', user.approval?.note],
    SUSPENDED: ['bg-amber-500', 'text-amber-800', 'Suspended', user.suspendedUntil && `Until ${dateText(user.suspendedUntil)}`],
    DEACTIVATED: ['bg-red-500', 'text-red-800', 'Deactivated', user.deactivationReason],
    INVITED: ['bg-sky-500', 'text-sky-800', 'Invitation sent', 'Has not set a password yet'],
    ACTIVE: ['bg-emerald-500', 'text-emerald-800', 'Active', ''],
  }[status];
  return (
    <div>
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${look[1]}`}><span className={`h-2 w-2 rounded-full ${look[0]}`} aria-hidden="true" />{look[2]}</span>
      {look[3] && <p className="mt-0.5 max-w-[16rem] truncate text-xs text-slate-500" title={look[3]}>{look[3]}</p>}
    </div>
  );
}

/**
 * User management by tier. SARRA HQ sees every account; a District SARRA Centre
 * sees its own District and PIA accounts. Makers request accounts and the tier
 * Approver approves them; the HQ administrator adds accounts directly.
 */
export function UserManagementPage({ newHref }) {
  const { user } = useAuth();
  const { addToast } = useUI();
  const [filters, setFilters] = useState({ search: '', role: '', workflowRole: '', approval: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ loading: true, error: '', items: [], pagination: { page: 1, totalPages: 1, total: 0 }, permissions: {}, pendingApproval: 0 });
  const [action, setAction] = useState(null); // { type, user }
  const [form, setForm] = useState({ note: '', until: '' });
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const isDistrict = user?.role === USER_ROLES.DD_LEVEL;
  const roleOptions = isDistrict ? DISTRICT_ROLES : Object.values(USER_ROLES);
  const { permissions, pendingApproval } = state;
  const myId = String(user?._id || user?.id || '');

  // Search waits for a pause in typing.
  useEffect(() => {
    const timer = setTimeout(() => { setFilters((current) => (current.search === search.trim() ? current : { ...current, search: search.trim() })); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let current = true;
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    fetchUsers({ ...filters, page, limit: LIMIT })
      .then((result) => { if (current) setState({ loading: false, error: '', ...result }); })
      .catch((err) => { if (current) setState((prev) => ({ ...prev, loading: false, error: err.message, items: [] })); });
    return () => { current = false; };
  }, [filters, page, attempt]);

  const setFilter = (key, value) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1); };
  const reload = () => setAttempt((n) => n + 1);

  const minDate = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); }, []);
  const open = (type, target) => {
    const until = new Date(); until.setMonth(until.getMonth() + 1);
    setForm({ note: '', until: until.toISOString().slice(0, 10) });
    setAttempted(false);
    setAction({ type, user: target });
  };
  const close = () => { if (!busy) setAction(null); };

  const note = form.note.replace(/\s+/g, ' ').trim();
  const noteError = action?.type === 'reject' && note.length < 5 ? 'Give the reason for rejecting the request (at least 5 characters).' : '';
  const untilError = action?.type === 'suspend' && (!form.until || form.until < minDate) ? 'Choose a date after today.' : '';

  const confirm = async () => {
    setAttempted(true);
    if (noteError || untilError || busy) return;
    setBusy(true);
    const { type, user: target } = action;
    try {
      if (type === 'approve') await approveUser(target._id, note || undefined);
      if (type === 'reject') await rejectUser(target._id, note);
      if (type === 'suspend') await suspendUser(target._id, { until: new Date(`${form.until}T23:59:59`).toISOString(), reason: note || undefined });
      if (type === 'deactivate') await deactivateUser(target._id, { reason: note || undefined });
      if (type === 'restore') await restoreUser(target._id);
      addToast({
        approve: `${target.name} approved. The invitation has been emailed.`,
        reject: `Account request for ${target.name} rejected.`,
        suspend: `${target.name} suspended.`,
        deactivate: `${target.name} deactivated.`,
        restore: `Access restored for ${target.name}.`,
      }[type], 'success');
      setAction(null);
      reload();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const DIALOG = {
    approve: { title: 'Approve account request', description: 'The invitation with a one-time code is emailed as soon as you approve.', button: 'Approve & Send Invitation', variant: 'success', icon: Check, noteLabel: 'Remarks', optional: true },
    reject: { title: 'Reject account request', description: 'No invitation is sent. Your reason is recorded on the account and in the audit trail.', button: 'Reject Request', variant: 'primary', icon: X, noteLabel: 'Reason', optional: false },
    suspend: { title: 'Suspend access', description: 'The user cannot sign in until the date you choose.', button: 'Suspend', variant: 'primary', icon: Ban, noteLabel: 'Reason', optional: true },
    deactivate: { title: 'Deactivate account', description: 'The user cannot sign in until access is restored.', button: 'Deactivate', variant: 'primary', icon: UserX, noteLabel: 'Reason', optional: true },
    restore: { title: 'Restore access', description: 'The user can sign in again with their own password.', button: 'Restore Access', variant: 'success', icon: RotateCcw, noteLabel: '', optional: true },
  }[action?.type] || {};

  const addLabel = permissions.createsDirectly ? 'Invite User' : 'Request Account';
  const scopeText = isDistrict
    ? `${user?.district || ''} District SARRA Centre and its PIAs.`
    : 'SARRA HQ, every District SARRA Centre and PIA, and M&E.';

  return (
    <div className="mx-auto max-w-7xl p-4 pb-16 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy" aria-hidden="true"><Users className="h-5 w-5" /></span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Users</h1>
            <p className="text-sm text-slate-500">Accounts of {scopeText} Signed in as {roleLabelOf(user)}.</p>
          </div>
        </div>
        {permissions.canCreate && (
          <Link href={newHref} className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-navy-light hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:ring-offset-2">
            <UserPlus className="h-4 w-4" aria-hidden="true" /> {addLabel}
          </Link>
        )}
      </div>

      {pendingApproval > 0 && (
        <div className="mb-4">
          <Notice
            tone="warning"
            title={`${pendingApproval} account request${pendingApproval === 1 ? ' is' : 's are'} awaiting approval`}
            action={filters.approval !== 'PENDING' && <button type="button" onClick={() => setFilter('approval', 'PENDING')} className="flex-shrink-0 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">Show requests</button>}
          >
            {permissions.canApprove ? 'Approve a request to email the invitation, or reject it with a reason. You cannot decide a request you made yourself.' : 'The tier Approver approves them; the invitation is emailed only after approval.'}
          </Notice>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or employee ID" aria-label="Search users" className={`${inputClass(false)} pl-9`} />
          </div>
          <select value={filters.role} onChange={(event) => setFilter('role', event.target.value)} aria-label="Tier" className={`${inputClass(false)} w-auto`}>
            <option value="">All tiers</option>
            {roleOptions.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
          </select>
          <select value={filters.workflowRole} onChange={(event) => setFilter('workflowRole', event.target.value)} aria-label="Workflow role" className={`${inputClass(false)} w-auto`}>
            <option value="">Maker, Checker & Approver</option>
            {Object.entries(WORKFLOW_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={filters.approval === 'PENDING'} onChange={(event) => setFilter('approval', event.target.checked ? 'PENDING' : '')} className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-navy/40" />
            Awaiting approval
          </label>
        </div>

        {state.loading && <div className="space-y-2 p-5" role="status" aria-label="Loading users">{[0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-12" />)}</div>}
        {!state.loading && state.error && <div className="p-5"><Notice tone="error" title="Unable to load users." action={<RetryButton onClick={reload} />}>{state.error}</Notice></div>}
        {!state.loading && !state.error && state.items.length === 0 && (
          <div className="flex flex-col items-center px-5 py-14 text-center text-sm text-slate-500">
            <ShieldAlert className="mb-3 h-10 w-10 text-slate-300" aria-hidden="true" />
            No account matches these filters.
          </div>
        )}
        {!state.loading && !state.error && state.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-2.5">User</th>
                  <th scope="col" className="px-3 py-2.5">Role</th>
                  <th scope="col" className="px-3 py-2.5">Jurisdiction</th>
                  <th scope="col" className="px-3 py-2.5">Status</th>
                  <th scope="col" className="px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.items.map((account) => {
                  const status = statusOf(account);
                  const self = String(account._id) === myId;
                  return (
                    <tr key={account._id} className="align-top hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900">{account.name}</p>
                        <p className="text-xs text-slate-500">{account.email}</p>
                        {account.designation && <p className="text-xs text-slate-500">{account.designation}</p>}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-block whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold ${ROLE_TONE[account.role] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>{account.roleLabel || roleLabelOf(account)}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        <p>{account.district || (account.role === USER_ROLES.SUPER_ADMIN ? 'State' : 'All districts')}</p>
                        {account.department && <p className="text-xs text-slate-500">{account.department}</p>}
                      </td>
                      <td className="px-3 py-3"><StatusCell user={account} /></td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          {self && <span className="text-xs font-medium text-slate-400">You</span>}
                          {account.canApprove && (
                            <>
                              <ActionButton size="sm" variant="success" icon={Check} onClick={() => open('approve', account)}>Approve</ActionButton>
                              <ActionButton size="sm" variant="secondary" icon={X} onClick={() => open('reject', account)}>Reject</ActionButton>
                            </>
                          )}
                          {status === 'REQUESTED' && !account.canApprove && <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> With the Approver</span>}
                          {account.canManage && !self && ['ACTIVE', 'INVITED'].includes(status) && (
                            <>
                              <ActionButton size="sm" variant="secondary" icon={Ban} onClick={() => open('suspend', account)}>Suspend</ActionButton>
                              <ActionButton size="sm" variant="ghost" icon={UserX} onClick={() => open('deactivate', account)}>Deactivate</ActionButton>
                            </>
                          )}
                          {account.canManage && !self && ['SUSPENDED', 'DEACTIVATED'].includes(status) && (
                            <ActionButton size="sm" variant="secondary" icon={RotateCcw} onClick={() => open('restore', account)}>Restore</ActionButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {state.pagination.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={state.pagination.page} totalPages={state.pagination.totalPages} totalItems={state.pagination.total} limit={LIMIT} onPageChange={setPage} />
        </div>
      )}

      <Dialog
        open={Boolean(action)}
        onClose={close}
        dismissible={!busy}
        title={DIALOG.title}
        description={DIALOG.description}
        footer={(
          <>
            <ActionButton variant="secondary" onClick={close} disabled={busy}>Cancel</ActionButton>
            <ActionButton variant={DIALOG.variant} icon={DIALOG.icon} loading={busy} onClick={confirm}>{DIALOG.button}</ActionButton>
          </>
        )}
      >
        {action && (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <p className="font-semibold text-slate-900">{action.user.name}</p>
              <p className="text-slate-600">{action.user.roleLabel || roleLabelOf(action.user)}{action.user.district ? ` · ${action.user.district}` : ''}{action.user.department ? ` · ${action.user.department}` : ''}</p>
              <p className="text-xs text-slate-500">{action.user.email}</p>
            </div>
            {action.type === 'suspend' && (
              <Field id="suspend-until" label="Suspend until" required error={attempted ? untilError : ''}>
                <input id="suspend-until" type="date" min={minDate} value={form.until} disabled={busy} onChange={(event) => setForm((current) => ({ ...current, until: event.target.value }))} className={inputClass(Boolean(attempted && untilError))} />
              </Field>
            )}
            {DIALOG.noteLabel && (
              <Field id="user-action-note" label={DIALOG.noteLabel} required={!DIALOG.optional} optional={DIALOG.optional} error={attempted ? noteError : ''}>
                <textarea id="user-action-note" rows={3} maxLength={500} value={form.note} disabled={busy} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className={`${inputClass(Boolean(attempted && noteError))} resize-none`} />
              </Field>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
