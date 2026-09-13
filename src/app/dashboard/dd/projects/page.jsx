"use client";
import React, { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { ProjectsTable } from '@/components/ui/ProjectsTable';
import { Card, CardHeader } from '@/components/ui/Card';
import { FilterBar } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { SANCTION_STATUS } from '@/constants/status';
import { Building2 } from 'lucide-react';

const FINANCIAL_YEARS = ['2023-2024', '2024-2025', '2025-2026', '2026-2027'];

export default function DDProjectsPage() {
  const [filters, setFilters] = useState({
    status: '',
    financialYear: '2025-2026',
    page: 1,
    limit: 15,
  });

  const { projects, pagination, loading } = useProjects('DD_LEVEL', filters);

  const pendingAcceptance = projects.filter(p => p.status === SANCTION_STATUS.FORWARDED_TO_DISTRICT);
  const activeProjects = projects.filter(p =>
    [SANCTION_STATUS.DISTRICT_ACCEPTED, SANCTION_STATUS.FORWARDED_TO_PIA, SANCTION_STATUS.PIA_ACCEPTED].includes(p.status)
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
          <Building2 className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">District Projects</h1>
          <p className="text-slate-500 text-sm">Manage projects forwarded to your district</p>
        </div>
      </div>

      {/* Pending Acceptance Alert */}
      {pendingAcceptance.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-bold text-amber-800">{pendingAcceptance.length} project(s) awaiting your acceptance</p>
            <p className="text-sm text-amber-700">Click on any project to accept and allocate funds.</p>
          </div>
        </div>
      )}

      <FilterBar
        filters={filters}
        onChange={(f) => setFilters(prev => ({ ...prev, ...f, page: 1 }))}
        onApply={() => {}}
        onClear={() => setFilters({ status: '', financialYear: '2025-2026', page: 1, limit: 15 })}
        options={{
          status: Object.entries(SANCTION_STATUS)
            .filter(([, v]) => [
              SANCTION_STATUS.FORWARDED_TO_DISTRICT,
              SANCTION_STATUS.DISTRICT_ACCEPTED,
              SANCTION_STATUS.FORWARDED_TO_PIA,
              SANCTION_STATUS.PIA_ACCEPTED
            ].includes(v))
            .map(([, v]) => ({ value: v, label: v.replace(/_/g, ' ') })),
          financialYear: FINANCIAL_YEARS.map(y => ({ value: y, label: y })),
        }}
      />

      <Card noPadding className="mt-4">
        <CardHeader
          title={`District Projects ${pagination ? `(${pagination.total || 0})` : ''}`}
          action={
            <div className="flex gap-4 text-xs font-semibold">
              <span className="text-amber-600">{pendingAcceptance.length} pending acceptance</span>
              <span className="text-emerald-600">{activeProjects.length} active</span>
            </div>
          }
        />
        <ProjectsTable
          projects={projects}
          loading={loading}
          detailBasePath="/dashboard/dd/projects"
          extraColumns={[
            {
              key: 'mprStatus',
              label: 'MPR Status',
              render: (project) => {
                if (project.unreviewedMprCount > 0) {
                  return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      {project.unreviewedMprCount} New MPR(s)
                    </span>
                  );
                }
                return <span className="text-slate-400 text-xs font-medium">—</span>;
              }
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
