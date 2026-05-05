"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { FilterBar } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { useUI } from '@/contexts/UIContext';
import { Plus, Edit, Trash2, Power } from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();
  const { addToast } = useUI();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', role: '', district: '' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: pagination.page,
        limit: 10,
        ...filters
      }).toString();
      
      const res = await apiCall(`/users?${query}`);
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
    fetchUsers();
  }, [pagination.page, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleStatus = async (id, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) return;
    
    try {
      const res = await apiCall(`/users/${id}/status`, {
        method: 'PATCH',
        body: { isActive: !currentStatus }
      });
      if (res?.success) {
        addToast(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
        fetchUsers();
      }
    } catch (e) {
      addToast('Failed to update user status', 'error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500">Manage officers, DDs, and admin accounts</p>
        </div>
        <Button onClick={() => router.push('/dashboard/admin/users/new')} variant="primary">
          <Plus className="w-4 h-4 mr-2" /> Add New User
        </Button>
      </div>

      <FilterBar 
        filters={filters} 
        onChange={setFilters} 
        onApply={fetchUsers} 
        onClear={() => setFilters({ search: '', role: '', district: '' })}
        options={{
          role: [
            { value: 'PIA_OFFICER', label: 'PIA Officer' },
            { value: 'DD_LEVEL', label: 'DD Level' },
            { value: 'SUPER_ADMIN', label: 'Super Admin' }
          ],
          // Districts can be passed here if needed
        }}
      />

      {loading ? (
        <FullPageSpinner />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">District/Dept</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {user.district || '-'}<br/>
                      <span className="text-xs text-slate-400">{user.department || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleToggleStatus(user._id, user.isActive)} 
                        className={`p-1 mr-2 rounded ${user.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                        title={user.isActive ? 'Deactivate User' : 'Activate User'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-8 text-center text-slate-500">No users found</div>
            )}
          </div>
        </div>
      )}

      <Pagination 
        currentPage={pagination.page} 
        totalPages={pagination.totalPages} 
        totalItems={pagination.total} 
        limit={10}
        onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))} 
      />
    </div>
  );
}
