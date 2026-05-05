"use client";
import React, { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import { FilterBar } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/formatters';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { Card } from '@/components/ui/Card';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ action: '', role: '' });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        ...filters
      }).toString();
      
      const res = await apiCall(`/audit/logs?${query}`);
      if (res?.success) {
        setLogs(res.data);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (e) {
      console.error('Failed to fetch logs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">System Audit Logs</h1>
        <p className="text-slate-500">Track all activities across the platform</p>
      </div>

      <FilterBar 
        filters={filters} 
        onChange={setFilters} 
        onApply={fetchLogs} 
        onClear={() => setFilters({ action: '', role: '' })}
        options={{
          action: [
            { value: 'LOGIN', label: 'Login' },
            { value: 'SUBMIT_DPR', label: 'Submit Form' },
            { value: 'APPROVE', label: 'Approve' },
            { value: 'REJECT', label: 'Reject' },
            { value: 'EXPORT', label: 'Export' }
          ],
          role: [
            { value: 'PIA_OFFICER', label: 'PIA Officer' },
            { value: 'DD_LEVEL', label: 'DD Level' },
            { value: 'SUPER_ADMIN', label: 'Super Admin' }
          ]
        }}
      />

      {loading ? (
        <FullPageSpinner />
      ) : (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Resource</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">IP Address</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatDate(log.timestamp, 'dd MMM yyyy, HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{log.performedBy}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">{log.role}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-mono text-xs">{log.action}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{log.resource || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono text-xs">{log.ipAddress || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <div className="p-8 text-center text-slate-500">No logs found</div>
            )}
          </div>
        </Card>
      )}

      <Pagination 
        currentPage={pagination.page} 
        totalPages={pagination.totalPages} 
        totalItems={pagination.total} 
        limit={20}
        onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))} 
      />
    </div>
  );
}
