"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { useUI } from '@/contexts/UIContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FloatInput } from '@/components/forms/shared/FloatInput';
import { FloatSelect } from '@/components/forms/shared/FloatSelect';
import { DEPARTMENTS } from '@/constants/departments';
import { DISTRICTS } from '@/constants/districts';
import { ArrowLeft } from 'lucide-react';

export default function AddUserPage() {
  const router = useRouter();
  const { addToast } = useUI();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'PIA_OFFICER', district: '', department: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Add default password if not provided
    const dataToSubmit = { ...formData };
    if (!dataToSubmit.password) dataToSubmit.password = 'sarra@123'; // Default password for new users

    try {
      const res = await apiCall('/users', {
        method: 'POST',
        body: dataToSubmit
      });
      if (res?.success) {
        addToast('User created successfully', 'success');
        router.push('/dashboard/admin/users');
      } else {
        addToast(res?.message || 'Failed to create user', 'error');
      }
    } catch (error) {
      addToast('An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="px-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Add New User</h1>
          <p className="text-slate-500">Create a new system account</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
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
              options={[
                { value: 'PIA_OFFICER', label: 'PIA Officer' },
                { value: 'DD_LEVEL', label: 'DD Level' },
                { value: 'SUPER_ADMIN', label: 'Super Admin' }
              ]}
              value={formData.role}
              onChange={handleChange}
              required
            />

            <FloatInput
              id="password"
              label="Password (optional, default: sarra@123)"
              type="password"
              value={formData.password}
              onChange={handleChange}
            />

            {formData.role !== 'SUPER_ADMIN' && (
              <>
                <FloatSelect
                  id="district"
                  label="District"
                  options={DISTRICTS}
                  value={formData.district}
                  onChange={handleChange}
                  required
                />
                
                {formData.role === 'PIA_OFFICER' && (
                  <FloatSelect
                    id="department"
                    label="Department"
                    options={DEPARTMENTS}
                    value={formData.department}
                    onChange={handleChange}
                    required
                  />
                )}
              </>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Create User
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
