"use client";
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProjectDetail } from '@/hooks/useProjects';
import { ProjectDetailPanel } from '@/components/ui/ProjectDetailPanel';
import { Button } from '@/components/ui/Button';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { patch } from '@/lib/api';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import { SANCTION_STATUS } from '@/constants/status';

export default function OfficerProjectDetailPage() {
  const { id } = useParams();
  const { project, loading, error, refetch } = useProjectDetail(id);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  if (loading) return <FullPageSpinner />;
  if (error || !project) {
    return <div className="p-8 text-center text-red-500">Failed to load: {error || 'Not found'}</div>;
  }

  const handleAccept = async () => {
    setActionError('');
    setBusy(true);
    try {
      const res = await patch(`/sanctions/${id}/pia-accept`, {});
      if (res?.success) {
        await refetch();
      } else {
        setActionError(res?.message || 'Failed to accept project');
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const { status } = project;

  const actions = (
    <div className="space-y-3">
      {actionError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {actionError}
        </div>
      )}

      {status === SANCTION_STATUS.FORWARDED_TO_PIA && (
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleAccept}
            disabled={busy}
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> Accept Project & Activate
          </Button>
        </div>
      )}

      {status === SANCTION_STATUS.PIA_ACCEPTED && (
        <p className="text-sm text-emerald-700 font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> You have accepted this project. It is active and ready for monthly MPR filings.
        </p>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/officer/projects" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900">
          Project — {project.sanctionId || project.projectTitle}
        </h1>
      </div>

      <ProjectDetailPanel project={project} actions={actions} />
    </div>
  );
}
