"use client";
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProjectDetail } from '@/hooks/useProjects';
import { ProjectDetailPanel } from '@/components/ui/ProjectDetailPanel';
import { Button } from '@/components/ui/Button';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { patch } from '@/lib/api';
import { ChevronLeft, CheckCircle, XCircle, Send, Clock } from 'lucide-react';
import { SANCTION_STATUS } from '@/constants/status';
import { useAuth } from '@/hooks/useAuth';

function ActionModal({ title, label, onConfirm, onClose, hasNote = true, placeholder = 'Add a note...' }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const handleConfirm = async () => {
    setBusy(true);
    await onConfirm(note);
    setBusy(false);
  };
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
        <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>
        {hasNote && (
          <textarea
            rows={4}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            placeholder={placeholder}
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        )}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirm} disabled={busy}>
            {busy ? 'Processing...' : label}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { project, loading, error, refetch } = useProjectDetail(id);
  const [modal, setModal] = useState(null);
  const [actionError, setActionError] = useState('');

  if (loading) return <FullPageSpinner />;
  if (error || !project) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load project: {error || 'Not found'}
      </div>
    );
  }

  const doAction = async (endpoint, payload) => {
    setActionError('');
    try {
      const res = await patch(endpoint, payload);
      if (res?.success) {
        setModal(null);
        await refetch();
      } else {
        setActionError(res?.message || 'Action failed');
        setModal(null);
      }
    } catch (err) {
      setActionError(err.message);
      setModal(null);
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

      {status === SANCTION_STATUS.PENDING_CHECKER && (
        user?.workflowRole === 'CHECKER' ? (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setModal('checker')}
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Checker Verify
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setModal('reject')}
              className="flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Reject
            </Button>
          </div>
        ) : (
          <p className="text-sm text-amber-700 font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" /> Awaiting Checker Verification.
          </p>
        )
      )}

      {status === SANCTION_STATUS.PENDING_APPROVER && (
        user?.workflowRole === 'APPROVER' ? (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setModal('approve')}
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Approve & Sanction
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setModal('reject')}
              className="flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Reject
            </Button>
          </div>
        ) : (
          <p className="text-sm text-amber-700 font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" /> Awaiting Final Approval.
          </p>
        )
      )}

      {status === SANCTION_STATUS.SANCTIONED && (
        user?.workflowRole === 'MAKER' ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModal('forward')}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Forward to District
          </Button>
        ) : (
          <p className="text-sm text-indigo-700 font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Project Sanctioned. Awaiting forwarding to district by Maker.
          </p>
        )
      )}

      {(status === SANCTION_STATUS.REJECTED) && (
        <p className="text-sm text-red-600 font-medium">
          This project was rejected. {project.rejectionReason && `Reason: "${project.rejectionReason}"`}
        </p>
      )}

      {[SANCTION_STATUS.FORWARDED_TO_DISTRICT, SANCTION_STATUS.DISTRICT_ACCEPTED, SANCTION_STATUS.FORWARDED_TO_PIA, SANCTION_STATUS.PIA_ACCEPTED].includes(status) && (
        <p className="text-sm text-emerald-700 font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Project is in the district/PIA workflow stage.
        </p>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/admin/projects" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900">
          Project Detail — {project.sanctionId || project.projectTitle}
        </h1>
      </div>

      <ProjectDetailPanel project={project} actions={actions} />

      {/* Modals */}
      {modal === 'checker' && (
        <ActionModal
          title="Checker Verification"
          label="Verify"
          placeholder="Add your verification note..."
          onConfirm={async (note) => doAction(`/sanctions/${id}/checker-verify`, { note })}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'approve' && (
        <ActionModal
          title="Approve & Sanction Project"
          label="Approve"
          placeholder="Approval note (optional)..."
          onConfirm={async (note) => doAction(`/sanctions/${id}/approve`, { note })}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'reject' && (
        <ActionModal
          title="Reject Project"
          label="Reject"
          placeholder="Rejection reason (required)..."
          onConfirm={async (note) => doAction(`/sanctions/${id}/reject`, { reason: note })}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'forward' && (
        <ActionModal
          title="Forward to District"
          label="Forward"
          hasNote={false}
          onConfirm={async () => doAction(`/sanctions/${id}/forward-district`, {})}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
