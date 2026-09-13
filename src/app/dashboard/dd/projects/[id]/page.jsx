"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProjectDetail } from '@/hooks/useProjects';
import { ProjectDetailPanel } from '@/components/ui/ProjectDetailPanel';
import { Button } from '@/components/ui/Button';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { patch, get } from '@/lib/api';
import { ChevronLeft, CheckCircle, Send, User } from 'lucide-react';
import { SANCTION_STATUS } from '@/constants/status';

function ForwardToPIAModal({ onConfirm, onClose }) {
  const [selectedPIA, setSelectedPIA] = useState('');
  const [piaOfficers, setPiaOfficers] = useState([]);
  const [loadingOfficers, setLoadingOfficers] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await get('/admin/users?role=PIA_OFFICER');
      if (res?.success) {
        const list = Array.isArray(res.data) ? res.data :
          (res.data?.users || res.data?.data || []);
        setPiaOfficers(list);
      }
      setLoadingOfficers(false);
    };
    load();
  }, []);

  const handleConfirm = async () => {
    if (!selectedPIA) return;
    setBusy(true);
    await onConfirm(selectedPIA);
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Assign to PIA Officer</h3>
        <p className="text-sm text-slate-500 mb-4">Select the PIA Officer who will manage this project.</p>

        {loadingOfficers ? (
          <div className="h-10 bg-slate-100 rounded-lg animate-pulse mb-4" />
        ) : (
          <select
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={selectedPIA}
            onChange={e => setSelectedPIA(e.target.value)}
          >
            <option value="">-- Select PIA Officer --</option>
            {piaOfficers.map(o => (
              <option key={o._id} value={o._id}>
                {o.name} ({o.department || o.district || 'N/A'})
              </option>
            ))}
          </select>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirm} disabled={busy || !selectedPIA}>
            {busy ? 'Assigning...' : 'Assign to PIA'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AcceptModal({ onConfirm, onClose }) {
  const [allocatedAmount, setAllocatedAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    await onConfirm(allocatedAmount);
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Accept Project</h3>
        <p className="text-sm text-slate-500 mb-4">Confirm fund allocation for this project.</p>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Allocated Amount (Lakh)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-teal-400"
          placeholder="Enter allocated amount..."
          value={allocatedAmount}
          onChange={e => setAllocatedAmount(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirm} disabled={busy}>
            {busy ? 'Accepting...' : 'Accept Project'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DDProjectDetailPage() {
  const { id } = useParams();
  const { project, loading, error, refetch } = useProjectDetail(id);
  const [modal, setModal] = useState(null);
  const [actionError, setActionError] = useState('');

  if (loading) return <FullPageSpinner />;
  if (error || !project) {
    return <div className="p-8 text-center text-red-500">Failed to load: {error || 'Not found'}</div>;
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

      {status === SANCTION_STATUS.FORWARDED_TO_DISTRICT && (
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => setModal('accept')} className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Accept Project & Allocate Funds
          </Button>
        </div>
      )}

      {status === SANCTION_STATUS.DISTRICT_ACCEPTED && (
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => setModal('pia')} className="flex items-center gap-2">
            <User className="w-4 h-4" /> Assign to PIA Officer
          </Button>
        </div>
      )}

      {status === SANCTION_STATUS.FORWARDED_TO_PIA && (
        <p className="text-sm text-indigo-700 font-medium flex items-center gap-2">
          <Send className="w-4 h-4" /> Assigned to PIA. Awaiting PIA acceptance.
        </p>
      )}

      {status === SANCTION_STATUS.PIA_ACCEPTED && (
        <div className="space-y-3">
          <p className="text-sm text-emerald-700 font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Project is ACTIVE — PIA is submitting MPRs.
          </p>
          {project.unreviewedMprCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-2">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <p className="text-sm font-bold text-amber-900">
                  {project.unreviewedMprCount} New MPR(s) submitted!
                </p>
              </div>
              <p className="text-sm text-amber-700 mt-1 mb-3 ml-6">
                The PIA Officer has submitted new progress reports for this project. Please review them.
              </p>
              <div className="ml-6">
                <Link href="/dashboard/dd/mpr-review">
                  <Button variant="primary" size="sm">
                    Review Now →
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/dd/projects" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900">
          Project — {project.sanctionId || project.projectTitle}
        </h1>
      </div>

      <ProjectDetailPanel project={project} actions={actions} />

      {modal === 'accept' && (
        <AcceptModal
          onConfirm={async (allocatedAmountLakh) =>
            doAction(`/sanctions/${id}/district-accept`, { allocatedAmountLakh: parseFloat(allocatedAmountLakh) || 0 })
          }
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'pia' && (
        <ForwardToPIAModal
          onConfirm={async (piaUserId) => doAction(`/sanctions/${id}/forward-pia`, { piaUserId })}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
