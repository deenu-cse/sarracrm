"use client";
import React from 'react';
import { WorkflowTimeline } from '@/components/ui/WorkflowTimeline';
import { Notice } from '@/components/projects/create/parts';
import { ENTRY_MODE_LABELS } from '@/constants/status';
import { DataItem, DocumentLink, EmptyNote, Panel, formatMoment } from './shared';
import { RevisionsPanel } from './RevisionsPanel';

function Signatory({ role, person, at, note, pending }) {
  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${person ? 'bg-navy/10 text-navy' : 'bg-slate-100 text-slate-400'}`} aria-hidden="true">
        {person?.name ? person.name.trim().charAt(0).toUpperCase() : '–'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{role}</p>
        <p className="text-sm font-semibold text-slate-900">{person?.name || <span className="font-normal text-slate-400">{pending}</span>}</p>
        {person && <p className="text-xs text-slate-500">{[person.email, formatMoment(at, true)].filter((v) => v && v !== '—').join(' · ')}</p>}
        {note && <p className="mt-1 rounded border border-slate-100 bg-slate-50 px-2 py-1 text-xs italic text-slate-600">“{note}”</p>}
      </div>
    </li>
  );
}

/** Audit view: full history, who signed off at each tier, assignment downstream, and every document. */
export function WorkflowTab({ project, user, canSeeRevisions = false, onChanged }) {
  const orders = [
    project.secretariatApprovalOrder?.url && { url: project.secretariatApprovalOrder.url, name: 'Secretariat Approval Order', meta: `Attached at sanction · ${formatMoment(project.approverAt)}` },
    project.stateSanctionOrder?.url && { url: project.stateSanctionOrder.url, name: 'State Sanction Order', meta: `Attached at sanction · ${formatMoment(project.approverAt)}` },
  ].filter(Boolean);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        {project.status === 'REJECTED' && (
          <Notice tone="error" title={`Returned to the HQ Maker${project.rejectedAt ? ` on ${formatMoment(project.rejectedAt)}` : ''}`}>
            {project.rejectionReason || 'No objection was recorded.'}
          </Notice>
        )}
        {canSeeRevisions && <RevisionsPanel project={project} user={user} onChanged={onChanged} />}
        <Panel title="Workflow History" description="Every step taken on this project, oldest first.">
          <WorkflowTimeline history={project.workflowHistory || []} />
        </Panel>
      </div>

      <div className="space-y-5">
        <Panel title="SARRA HQ Sign-off">
          <ul className="divide-y divide-slate-100">
            <Signatory role="HQ Maker" person={project.makerUserId} at={project.makerAt} note={project.makerNote} pending="—" />
            <Signatory role="HQ Checker" person={project.checkerUserId} at={project.checkerAt} note={project.checkerNote} pending="Not verified yet" />
            <Signatory role="HQ Approver" person={project.approverUserId} at={project.approverAt} note={project.approverNote} pending="Not sanctioned yet" />
          </ul>
        </Panel>

        {(project.forwardedToDistrictAt || project.forwardedToPIA) && (
          <Panel title="District & PIA">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <DataItem label="District" value={project.forwardedToDistrict || project.district} />
              <DataItem label="Forwarded On" value={formatMoment(project.forwardedToDistrictAt)} />
              <DataItem label="Accepted By (District Maker)" value={project.districtAcceptedBy?.name} />
              <DataItem label="Accepted On" value={formatMoment(project.districtAcceptedAt)} />
              {(project.departmentAllocations || []).some((d) => d.piaUserId || d.districtStaffUserId) && (
                <div className="col-span-2">
                  <dt className="text-xs font-medium text-slate-500">PIA Makers and reporting responsibility</dt>
                  <dd className="mt-1">
                    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
                      {(project.departmentAllocations || []).map((d) => (
                        <li key={String(d.departmentId)} className="flex items-start justify-between gap-3 px-3 py-2">
                          <span className="font-medium text-slate-800">{d.departmentName}</span>
                          <span className="text-right">
                            <span className="block text-slate-900">{d.piaUserId?.name || <span className="text-slate-400">Not assigned</span>}</span>
                            {d.piaUserId && <span className={`block text-xs ${d.piaAcceptedAt ? 'text-emerald-700' : 'text-amber-700'}`}>{d.piaAcceptedAt ? `Accepted ${formatMoment(d.piaAcceptedAt)}` : `Assigned ${formatMoment(d.piaAssignedAt)}`}</span>}
                            <span className="block text-xs text-slate-500">MPR: {ENTRY_MODE_LABELS[d.reportingMode === 'DISTRICT' ? 'DISTRICT' : 'PIA']}</span>
                            {d.districtStaffUserId && <span className="block text-xs text-slate-500">District Technical Staff: {d.districtStaffUserId.name || 'mapped'}</span>}
                            {(d.piaHistory || []).map((past, index) => (
                              <span key={`${past.relievedAt}-${index}`} className="block text-xs text-slate-400">Earlier: {past.name || 'officer'} until {formatMoment(past.relievedAt)}{past.reason ? ` — ${past.reason}` : ''}</span>
                            ))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
              {project.forwardedToPIA && (
                <>
                  <DataItem label="PIA Maker" value={project.forwardedToPIA.name} />
                  <DataItem label="PIA Department" value={project.forwardedToPIA.department} />
                  <DataItem label="Assigned On" value={formatMoment(project.piaForwardedAt)} />
                  <DataItem label="PIA Accepted On" value={formatMoment(project.piaAcceptedAt)} />
                </>
              )}
            </dl>
          </Panel>
        )}

        <Panel title="Documents" description={`${orders.length} on record`}>
          {orders.length === 0 ? (
            <EmptyNote>No sanction order has been attached to this project yet.</EmptyNote>
          ) : (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Sanction Orders</h3>
              <div className="space-y-2">{orders.map((order) => <DocumentLink key={order.name} {...order} />)}</div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
