"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall, patch } from '@/lib/api';
import { FilterBar } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { useUI } from '@/contexts/UIContext';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLES } from '@/constants/roles';
import { getDashboardRoute } from '@/lib/routes';
import {
  Plus, Users, ShieldAlert, Clock, MoreVertical,
  Ban, UserX, RotateCcw, CalendarDays
} from 'lucide-react';

function monthsBetween(from, to) {
  if (!from || !to) return 0;
  const start = new Date(from);
  const end = new Date(to);
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    (end.getDate() >= start.getDate() ? 0 : -1);
  return Math.max(0, months);
}

function durationLabel(until) {
  if (!until) return '';
  const now = new Date();
  const end = new Date(until);
  const ms = end - now;
  if (ms <= 0) return 'Date must be in the future';
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  const months = monthsBetween(now, end);
  if (months >= 1) {
    return `≈ ${months} month${months === 1 ? '' : 's'} suspended (${days} day${days === 1 ? '' : 's'})`;
  }
  return `${days} day${days === 1 ? '' : 's'} suspended`;
}

function StatusBadge({ user }) {
  const status = user.accountStatus || (user.isActive ? 'ACTIVE' : 'DEACTIVATED');
  if (user.invitePending) {
    return (
      <div className="flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-xs font-bold text-amber-700">INVITE PENDING</span>
      </div>
    );
  }
  if (status === 'SUSPENDED') {
    return (
      <div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-xs font-bold text-amber-700">SUSPENDED</span>
        </div>
        {user.suspendedUntil && (
          <p className="text-[11px] text-slate-400 mt-1">
            Until {new Date(user.suspendedUntil).toLocaleDateString()}
          </p>
        )}
      </div>
    );
  }
  if (status === 'DEACTIVATED' || user.isActive === false) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-xs font-bold text-red-700">DEACTIVATED</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-emerald-500" />
      <span className="text-xs font-bold text-emerald-700">ACTIVE</span>
    </div>
  );
}

function ActionMenu({ user, currentUserId, onSuspend, onDeactivate, onRestore }) {
  const [open, setOpen] = useState(false);
  const status = user.accountStatus || (user.isActive ? 'ACTIVE' : 'DEACTIVATED');
  const isSelf = user._id === currentUserId;

  useEffect(() => {
    const close = () => setOpen(false);
    if (open) {
      window.addEventListener('click', close);
      return () => window.removeEventListener('click', close);
    }
  }, [open]);

  if (isSelf) {
    return <span className="text-xs text-slate-400 font-medium">You</span>;
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
        aria-label="User actions"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      {open && (
        <div
          className="absolute right-0 z-20 mt-1 w-48 origin-top-right rounded-xl border border-slate-100 bg-white shadow-xl py-1"
          onClick={(e) => e.stopPropagation()}
        >
          {status === 'ACTIVE' && (
            <>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50"
                onClick={() => {
                  setOpen(false);
                  onSuspend(user);
                }}
              >
                <Ban className="w-4 h-4" /> Suspend
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50"
                onClick={() => {
                  setOpen(false);
                  onDeactivate(user);
                }}
              >
                <UserX className="w-4 h-4" /> Deactivate
              </button>
            </>
          )}
          {(status === 'SUSPENDED' || status === 'DEACTIVATED') && (
            <button
              type="button"
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50"
              onClick={() => {
                setOpen(false);
                onRestore(user);
              }}
            >
              <RotateCcw className="w-4 h-4" /> Restore access
            </button>
          )}
          {status === 'SUSPENDED' && (
            <button
              type="button"
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50"
              onClick={() => {
                setOpen(false);
                onDeactivate(user);
              }}
            >
              <UserX className="w-4 h-4" /> Deactivate
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { addToast } = useUI();
  const { user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', role: '', district: '' });
  const [menuUser, setMenuUser] = useState(null);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [until, setUntil] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isPureSuperAdmin =
    user?.role === USER_ROLES.SUPER_ADMIN &&
    (user?.workflowRole == null || user?.workflowRole === '');

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    if (!authLoading && user && !isPureSuperAdmin) {
      addToast('Only Super Admin can manage users', 'error');
      router.replace(getDashboardRoute(user.role));
    }
  }, [authLoading, user, isPureSuperAdmin, router, addToast]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: pagination.page,
        limit: 10,
        ...filters
      }).toString();

      const res = await apiCall(`/admin/users?${query}`);
      if (res?.success) {
        setUsers(res.data);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (e) {
      addToast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPureSuperAdmin) fetchUsers();
  }, [pagination.page, filters, isPureSuperAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const openSuspend = (u) => {
    setMenuUser(u);
    setReason('');
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    setUntil(d.toISOString().slice(0, 10));
    setSuspendOpen(true);
  };

  const openDeactivate = (u) => {
    setMenuUser(u);
    setReason('');
    setDeactivateOpen(true);
  };

  const handleSuspend = async (e) => {
    e.preventDefault();
    if (!until) {
      addToast('Please select a suspend until date', 'error');
      return;
    }
    const selected = new Date(until);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected <= today) {
      addToast('Suspend date cannot be today or in the past', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await patch(`/admin/users/${menuUser._id}/suspend`, {
        until: new Date(`${until}T23:59:59`).toISOString(),
        reason: reason.trim() || undefined
      });
      if (res?.success) {
        addToast('User suspended successfully', 'success');
        setSuspendOpen(false);
        fetchUsers();
      } else {
        addToast(res?.message || 'Failed to suspend user', 'error');
      }
    } catch {
      addToast('Failed to suspend user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await patch(`/admin/users/${menuUser._id}/deactivate`, {
        reason: reason.trim() || undefined
      });
      if (res?.success) {
        addToast('User deactivated successfully', 'success');
        setDeactivateOpen(false);
        fetchUsers();
      } else {
        addToast(res?.message || 'Failed to deactivate user', 'error');
      }
    } catch {
      addToast('Failed to deactivate user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async (u) => {
    if (!window.confirm(`Restore access for ${u.name}?`)) return;
    try {
      const res = await patch(`/admin/users/${u._id}/restore`, {});
      if (res?.success) {
        addToast('User access restored', 'success');
        fetchUsers();
      } else {
        addToast(res?.message || 'Failed to restore user', 'error');
      }
    } catch {
      addToast('Failed to restore user', 'error');
    }
  };

  const roleColors = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
    MND_SUPER_ADMIN: 'bg-slate-900 text-white border-slate-700',
    MND_OFFICER: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    DD_LEVEL: 'bg-blue-100 text-blue-700 border-blue-200',
    PIA_OFFICER: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  if (authLoading || !isPureSuperAdmin) {
    return <FullPageSpinner />;
  }

  return (
    <div className="p-6 max-w-[1700px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-600" />
            User Access Management
          </h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">
            Invite · Suspend · Deactivate · Restore
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/admin/users/new')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6"
        >
          <Plus className="w-5 h-5 mr-2" /> Invite User
        </Button>
      </div>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        onApply={fetchUsers}
        onClear={() => setFilters({ search: '', role: '', district: '' })}
        options={{
          role: [
            { value: 'SUPER_ADMIN', label: 'Super Admin' },
            { value: 'MND_SUPER_ADMIN', label: 'MND Super Admin' },
            { value: 'MND_OFFICER', label: 'MND Officer' },
            { value: 'DD_LEVEL', label: 'DD Level' },
            { value: 'PIA_OFFICER', label: 'PIA Officer' },
          ],
        }}
      />

      {loading ? (
        <FullPageSpinner />
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mt-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">User Details</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Role</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jurisdiction</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${roleColors[u.role] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-bold text-slate-800">{u.district || 'All Districts'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{u.department || 'All Departments'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge user={u} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <ActionMenu
                        user={u}
                        currentUserId={user?._id || user?.id}
                        onSuspend={openSuspend}
                        onDeactivate={openDeactivate}
                        onRestore={handleRestore}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-20 flex flex-col items-center justify-center text-slate-400">
                <ShieldAlert className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">No users found matching criteria</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6">
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          limit={10}
          onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
        />
      </div>

      <Modal
        isOpen={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        title="Suspend User Access"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSuspend} className="space-y-5">
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
            <p className="text-sm text-amber-900 font-semibold">{menuUser?.name}</p>
            <p className="text-xs text-amber-700 mt-0.5">{menuUser?.email}</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Suspend until <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                min={minDate}
                value={until}
                onChange={(e) => setUntil(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy focus:border-navy"
                required
              />
            </div>
            {until && (
              <p className="mt-2 text-sm font-medium text-amber-700">{durationLabel(until)}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Reason <span className="text-slate-400 normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this account being suspended?"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy focus:border-navy resize-none"
              maxLength={500}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setSuspendOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting} className="bg-amber-600 hover:bg-amber-700">
              Confirm Suspend
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title="Deactivate User"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleDeactivate} className="space-y-5">
          <div className="rounded-xl bg-red-50 border border-red-100 p-4">
            <p className="text-sm text-red-900 font-semibold">This permanently blocks login until restored.</p>
            <p className="text-xs text-red-700 mt-2">{menuUser?.name} · {menuUser?.email}</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Reason <span className="text-slate-400 normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this account being deactivated?"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy focus:border-navy resize-none"
              maxLength={500}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setDeactivateOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={submitting}>
              Deactivate User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
