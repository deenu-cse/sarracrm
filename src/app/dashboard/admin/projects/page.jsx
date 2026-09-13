"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useProjects } from '@/hooks/useProjects';
import { ProjectsTable } from '@/components/ui/ProjectsTable';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FilterBar } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { SANCTION_STATUS } from '@/constants/status';
import { Plus, FolderOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const FINANCIAL_YEARS = ['2023-2024', '2024-2025', '2025-2026', '2026-2027'];

export default function AdminProjectsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    status: '',
    district: '',
    financialYear: '2025-2026',
    page: 1,
    limit: 15,
  });

  const { projects, pagination, loading } = useProjects('SUPER_ADMIN', filters);

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">All Projects</h1>
            <p className="text-slate-500 text-sm">State-level project sanctions management</p>
          </div>
        </div>
        {user?.workflowRole === 'MAKER' && (
          <Link href="/dashboard/admin/projects/create">
            <Button variant="primary" size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Project
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onChange={(f) => setFilters(prev => ({ ...prev, ...f, page: 1 }))}
        onApply={() => {}}
        onClear={() => setFilters({ status: '', district: '', financialYear: '2025-2026', page: 1, limit: 15 })}
        options={{
          status: Object.entries(SANCTION_STATUS).map(([, v]) => ({
            value: v,
            label: v.replace(/_/g, ' ')
          })),
          financialYear: FINANCIAL_YEARS.map(y => ({ value: y, label: y })),
        }}
        showDistrict
      />

      {/* Table */}
      <Card noPadding className="mt-4">
        <CardHeader
          title={`Projects ${pagination ? `(${pagination.total || 0})` : ''}`}
          action={
            <span className="text-xs text-slate-400 font-medium">
              Showing {projects.length} of {pagination?.total || '...'}
            </span>
          }
        />
        <ProjectsTable
          projects={projects}
          loading={loading}
          detailBasePath="/dashboard/admin/projects"
          extraColumns={[
            {
              key: 'maker',
              label: 'Created By',
              render: (p) => p.maker?.name || '—',
            }
          ]}
        />
        {pagination && (
          <div className="px-6 py-4 border-t border-slate-100">
            <Pagination
              pagination={pagination}
              onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
