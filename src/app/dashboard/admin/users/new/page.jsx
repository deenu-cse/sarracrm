"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { post } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FloatInput } from '@/components/forms/shared/FloatInput';
import { FloatSelect } from '@/components/forms/shared/FloatSelect';
import { DEPARTMENTS } from '@/constants/departments';
import { fetchDepartments } from '@/lib/projectApi';
import { DISTRICTS } from '@/constants/districts';
import { USER_ROLES } from '@/constants/roles';
import { getDashboardRoute } from '@/lib/routes';
import { ArrowLeft, Mail, ShieldCheck, UserPlus } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'PIA_OFFICER', label: 'PIA Officer' },
  { value: 'DD_LEVEL', label: 'DD Level' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'MND_OFFICER', label: 'MNE Officer' },
  { value: 'MND_SUPER_ADMIN', label: 'MNE Super Admin' },
];

export default function InviteUserPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { addToast } = useUI();
  const [loading, setLoading] = useState(false);
  // Departments come from the same master list projects use, so a PIA officer's
  // department always matches a project department. The fixed list is only a fallback.
  const [departmentOptions, setDepartmentOptions] = useState(DEPARTMENTS);
  useEffect(() => {
    fetchDepartments()
      .then((list) => { if (list.length) setDepartmentOptions(list.map((department) => department.name)); })
      .catch(() => {});
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'PIA_OFFICER',
    district: '',
    department: '',
  });

  const isPureSuperAdmin =
    user?.role === USER_ROLES.SUPER_ADMIN &&
    (user?.workflowRole == null || user?.workflowRole === '');

  useEffect(() => {
    if (!isLoading && user && !isPureSuperAdmin) {
      addToast('Only Super Admin can invite users', 'error');
      router.replace(getDashboardRoute(user.role));
    }
  }, [user, isLoading, isPureSuperAdmin, router, addToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const needsDistrict =
    formData.role === 'PIA_OFFICER' || formData.role === 'DD_LEVEL';
  const needsDepartment = formData.role === 'PIA_OFFICER';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      addToast('Name and email are required', 'error');
      return;
    }
    if (needsDistrict && !formData.district) {
      addToast('District is required for this role', 'error');
      return;
    }
    if (needsDepartment && !formData.department) {
      addToast('Department is required for PIA Officer', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        ...(needsDistrict && { district: formData.district }),
        ...(needsDepartment && { department: formData.department }),
      };

      const res = await post('/admin/users/invite', payload);
      if (res?.success) {
        addToast('Invitation email sent successfully', 'success');
        router.push('/dashboard/admin/users');
      } else {
        addToast(res?.message || 'Failed to send invitation', 'error');
      }
    } catch {
      addToast('An error occurred while sending invite', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !isPureSuperAdmin) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8 flex items-start gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="px-2 mt-1">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy/5 text-navy text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Super Admin only
          </div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-navy" />
            Invite New User
          </h1>
          <p className="text-slate-500 mt-1">
            Send a secure invitation. The user will set their own password via email OTP (valid 5 hours).
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 flex gap-3">
            <Mail className="w-5 h-5 text-navy flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-600 leading-relaxed">
              <p className="font-semibold text-slate-800 mb-1">How invitations work</p>
              <p>
                We email a professional invite with a one-time OTP. The recipient opens the link,
                verifies the OTP, sets a password, then can log in. No password is set by you.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FloatInput
              id="name"
              label="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <FloatInput
              id="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <FloatSelect
              id="role"
              label="User Role"
              options={ROLE_OPTIONS}
              value={formData.role}
              onChange={handleChange}
              required
            />

            {needsDistrict && (
              <FloatSelect
                id="district"
                label="District"
                options={DISTRICTS}
                value={formData.district}
                onChange={handleChange}
                required
              />
            )}

            {needsDepartment && (
              <FloatSelect
                id="department"
                label="Department"
                options={departmentOptions}
                value={formData.department}
                onChange={handleChange}
                required
              />
            )}
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
