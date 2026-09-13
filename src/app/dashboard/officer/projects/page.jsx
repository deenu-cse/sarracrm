"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/formatters';
import { patch } from '@/lib/api';
import { FolderOpen, CheckCircle, IndianRupee, ArrowRight, Clock } from 'lucide-react';
import { SANCTION_STATUS } from '@/constants/status';
import { FullPageSpinner } from '@/components/ui/Spinner';

export default function OfficerProjectsPage() {
  const { projects, loading, error, refetch } = useProjects('PIA_OFFICER');
  const [accepting, setAccepting] = useState(null);
  const [actionError, setActionError] = useState('');

  const handleAccept = async (projectId) => {
    setAccepting(projectId);
    setActionError('');
    try {
      const res = await patch(`/sanctions/${projectId}/pia-accept`, {});
      if (res?.success) {
        await refetch();
      } else {
        setActionError(res?.message || 'Failed to accept project');
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setAccepting(null);
    }
  };

  if (loading) return <FullPageSpinner />;

  const pending = projects.filter(p => p.status === SANCTION_STATUS.FORWARDED_TO_PIA);
  const active = projects.filter(p => p.status === SANCTION_STATUS.PIA_ACCEPTED);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <FolderOpen className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Projects</h1>
          <p className="text-slate-500 text-sm">Projects assigned to you by the District Director</p>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {actionError}
        </div>
      )}

      {/* Pending Acceptance */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Pending Acceptance ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map(project => (
              <div
                key={project._id}
                className="bg-white border-2 border-amber-200 rounded-2xl p-5 flex items-start justify-between gap-4 hover:border-amber-400 transition-colors shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-400">{project.sanctionId || 'Pending ID'}</span>
                    <Badge status={project.status} />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1 line-clamp-2">{project.projectTitle}</h3>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>{project.district}</span>
                    <span>{project.projectType}</span>
                    <span>{project.financialYear}</span>
                    <span className="flex items-center gap-1">
                      <IndianRupee className="w-3 h-3" />
                      {(project.totalSanctionedBudgetLakh || 0).toFixed(2)}L sanctioned
                    </span>
                    <span>Assigned: {formatDate(project.piaForwardedAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/dashboard/officer/projects/${project._id}`}>
                    <Button size="sm" variant="outline">View Details</Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={accepting === project._id}
                    onClick={() => handleAccept(project._id)}
                    className="flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {accepting === project._id ? 'Accepting...' : 'Accept Project'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Projects */}
      {active.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Active Projects ({active.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map(project => (
              <Link
                key={project._id}
                href={`/dashboard/officer/projects/${project._id}`}
                className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-slate-400">{project.sanctionId}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-500 text-white">
                    ACTIVE
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors">
                  {project.projectTitle}
                </h3>
                <div className="space-y-1 text-xs text-slate-500 mb-4">
                  <div className="flex justify-between">
                    <span>{project.district} · {project.projectType}</span>
                    <span>{project.financialYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Budget</span>
                    <span className="font-semibold text-slate-700">
                      ₹{(project.totalSanctionedBudgetLakh || 0).toFixed(2)}L
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accepted On</span>
                    <span className="font-semibold text-slate-700">{formatDate(project.piaAcceptedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                  File MPR <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {projects.length === 0 && (
        <div className="p-12 text-center text-slate-400">
          <div className="text-5xl mb-4">📋</div>
          <p className="font-medium text-lg">No projects assigned yet</p>
          <p className="text-sm mt-2">Projects will appear here when assigned by your District Director.</p>
        </div>
      )}
    </div>
  );
}
