"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Send, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import { ActionButton, Field, Notice, inputClass } from '@/components/projects/create/parts';
import { DEPARTMENTS } from '@/constants/departments';
import { DISTRICTS } from '@/constants/districts';
import { ROLE_LABELS, USER_ROLES, WORKFLOW_LABELS, isSystemAdmin, workflowRoleOf } from '@/constants/roles';
import { fetchDepartments } from '@/lib/projectApi';
import { inviteUser } from '@/lib/userApi';

const TIERED = [USER_ROLES.SUPER_ADMIN, USER_ROLES.DD_LEVEL, USER_ROLES.PIA_OFFICER];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADMINISTRATOR = 'ADMINISTRATOR';

/**
 * What the signed-in user may add (mirrors the backend rules):
 *   HQ administrator  any account, invited at once
 *   HQ Maker          any tier account, approved by the HQ Approver
 *   District Maker    District and PIA accounts of its own district, approved by the District Approver
 */
const scopeOf = (user) => {
  if (isSystemAdmin(user)) return { direct: true, roles: Object.values(USER_ROLES), district: null, approver: null };
  if (user?.role === USER_ROLES.SUPER_ADMIN && workflowRoleOf(user) === 'MAKER') return { direct: false, roles: Object.values(USER_ROLES), district: null, approver: 'the HQ Approver' };
  if (user?.role === USER_ROLES.DD_LEVEL && workflowRoleOf(user) === 'MAKER' && user.district) return { direct: false, roles: [USER_ROLES.DD_LEVEL, USER_ROLES.PIA_OFFICER], district: user.district, approver: `the ${user.district} District Approver` };
  return null;
};

export function UserInviteForm({ listHref }) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useUI();
  const scope = scopeOf(user);
  const [departments, setDepartments] = useState(DEPARTMENTS);
  const [form, setForm] = useState({ name: '', email: '', designation: '', phone: '', employeeId: '', role: '', workflowRole: '', district: '', department: '' });
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Departments come from the master list projects use, so a PIA account's department always matches a project department.
  useEffect(() => {
    fetchDepartments().then((list) => { if (list.length) setDepartments(list.map((department) => department.name)); }).catch(() => {});
  }, []);
  useEffect(() => {
    if (scope?.district) setForm((current) => ({ ...current, district: scope.district }));
    if (scope && !form.role) setForm((current) => ({ ...current, role: scope.roles.includes(USER_ROLES.PIA_OFFICER) ? USER_ROLES.PIA_OFFICER : scope.roles[0] }));
  }, [scope?.district, Boolean(scope)]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const tiered = TIERED.includes(form.role);
  const needsDistrict = [USER_ROLES.DD_LEVEL, USER_ROLES.PIA_OFFICER].includes(form.role);
  const needsDepartment = form.role === USER_ROLES.PIA_OFFICER;
  // Only the HQ administrator may create another administrator (an HQ account without a workflow role).
  const adminOption = form.role === USER_ROLES.SUPER_ADMIN && scope?.direct;

  const errors = {
    name: form.name.trim() ? '' : 'Enter the full name.',
    email: EMAIL.test(form.email.trim()) ? '' : 'Enter a valid email address.',
    role: form.role ? '' : 'Choose the tier.',
    workflowRole: tiered && !form.workflowRole ? 'Choose Maker, Checker or Approver.' : '',
    district: needsDistrict && !form.district ? 'Choose the district.' : '',
    department: needsDepartment && !form.department ? 'Choose the department.' : '',
  };
  const invalid = Object.values(errors).some(Boolean);

  const submit = async (event) => {
    event.preventDefault();
    setAttempted(true);
    if (invalid || busy) return;
    setBusy(true);
    setError('');
    try {
      const { message } = await inviteUser({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        workflowRole: tiered && form.workflowRole !== ADMINISTRATOR ? form.workflowRole : null,
        ...(needsDistrict && { district: form.district }),
        ...(needsDepartment && { department: form.department }),
        ...(form.designation.trim() && { designation: form.designation.trim() }),
        ...(form.phone.trim() && { phone: form.phone.trim() }),
        ...(form.employeeId.trim() && { employeeId: form.employeeId.trim() }),
      });
      addToast(message, 'success');
      router.push(listHref);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (!user) return null;
  if (!scope) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <Notice tone="warning" title="You cannot add users.">
          Accounts are added by the HQ administrator, or requested by the HQ Maker or a District Maker and approved by their tier&apos;s Approver.
        </Notice>
        <Link href={listHref} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to users</Link>
      </div>
    );
  }

  const fieldError = (key) => (attempted ? errors[key] : '');

  return (
    <div className="mx-auto max-w-3xl p-4 pb-16 sm:p-6">
      <Link href={listHref} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-navy"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Users</Link>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy" aria-hidden="true"><UserPlus className="h-5 w-5" /></span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{scope.direct ? 'Invite User' : 'Request Account'}</h1>
          <p className="text-sm text-slate-500">{scope.district ? `${scope.district} District SARRA Centre and its PIAs.` : 'Any tier: SARRA HQ, District SARRA Centre, PIA or M&E.'}</p>
        </div>
      </div>

      <form onSubmit={submit} noValidate className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-5 px-6 py-6">
          <div className="flex gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-600" aria-hidden="true" />
            <p>
              {scope.direct
                ? 'An invitation with a one-time code is emailed at once. The user sets their own password.'
                : `The request goes to ${scope.approver}. The invitation is emailed only after it is approved.`}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="user-name" label="Full name" required error={fieldError('name')}>
              <input id="user-name" value={form.name} onChange={(event) => set('name', event.target.value)} maxLength={100} className={inputClass(Boolean(fieldError('name')))} />
            </Field>
            <Field id="user-email" label="Email address" required error={fieldError('email')}>
              <input id="user-email" type="email" value={form.email} onChange={(event) => set('email', event.target.value)} maxLength={120} className={inputClass(Boolean(fieldError('email')))} />
            </Field>
            <Field id="user-designation" label="Designation" optional hint="Shown with the user's name in the audit trail and on reports.">
              <input id="user-designation" value={form.designation} onChange={(event) => set('designation', event.target.value)} maxLength={80} placeholder="e.g. Assistant Engineer" className={inputClass(false)} />
            </Field>
            <Field id="user-phone" label="Mobile" optional>
              <input id="user-phone" type="tel" value={form.phone} onChange={(event) => set('phone', event.target.value)} maxLength={15} className={inputClass(false)} />
            </Field>
            <Field id="user-employee" label="Employee ID" optional>
              <input id="user-employee" value={form.employeeId} onChange={(event) => set('employeeId', event.target.value)} maxLength={30} className={inputClass(false)} />
            </Field>
          </div>

          <div className="grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2">
            <Field id="user-role" label="Tier" required error={fieldError('role')}>
              <select id="user-role" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value, workflowRole: '', department: '' }))} className={inputClass(Boolean(fieldError('role')))}>
                <option value="" disabled>Choose</option>
                {scope.roles.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
              </select>
            </Field>
            {tiered && (
              <Field id="user-workflow" label="Workflow role" required error={fieldError('workflowRole')} hint="Maker enters, Checker verifies, Approver approves. Nobody approves their own entry.">
                <select id="user-workflow" value={form.workflowRole} onChange={(event) => set('workflowRole', event.target.value)} className={inputClass(Boolean(fieldError('workflowRole')))}>
                  <option value="" disabled>Choose</option>
                  {Object.entries(WORKFLOW_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  {adminOption && <option value={ADMINISTRATOR}>HQ Administrator (no workflow role, full access)</option>}
                </select>
              </Field>
            )}
            {needsDistrict && (
              <Field id="user-district" label="District" required error={fieldError('district')}>
                <select id="user-district" value={form.district} disabled={Boolean(scope.district)} onChange={(event) => set('district', event.target.value)} className={inputClass(Boolean(fieldError('district')))}>
                  <option value="" disabled>Choose</option>
                  {DISTRICTS.map((district) => <option key={district} value={district}>{district}</option>)}
                </select>
              </Field>
            )}
            {needsDepartment && (
              <Field id="user-department" label="Department (PIA)" required error={fieldError('department')}>
                <select id="user-department" value={form.department} onChange={(event) => set('department', event.target.value)} className={inputClass(Boolean(fieldError('department')))}>
                  <option value="" disabled>Choose</option>
                  {departments.map((department) => <option key={department} value={department}>{department}</option>)}
                </select>
              </Field>
            )}
          </div>

          {error && <Notice tone="error">{error}</Notice>}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 rounded-b-xl border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          {attempted && invalid && <p role="alert" className="text-sm font-medium text-red-700">Correct the highlighted fields.</p>}
          <ActionButton variant="secondary" onClick={() => router.push(listHref)} disabled={busy}>Cancel</ActionButton>
          <ActionButton type="submit" icon={Send} loading={busy}>{scope.direct ? 'Send Invitation' : 'Submit for Approval'}</ActionButton>
        </div>
      </form>
    </div>
  );
}
