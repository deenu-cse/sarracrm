"use client";
import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { WorkflowTimeline } from '@/components/ui/WorkflowTimeline';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatDate } from '@/lib/formatters';
import { IndianRupee, Building2, Calendar, Tag, User, FileText } from 'lucide-react';

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      {Icon && <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-slate-800 mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );
}

function BudgetBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="font-bold text-slate-700">₹{(value || 0).toFixed(2)}L</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ProjectDetailPanel({ project, actions }) {
  if (!project) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Main info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header Card */}
        <Card>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-mono font-bold text-slate-400 mb-1">
                {project.sanctionId || 'Sanction ID Pending'}
              </p>
              <h2 className="text-xl font-bold text-slate-900">{project.projectTitle}</h2>
            </div>
            <Badge status={project.status} size="md" />
          </div>

          <div className="space-y-0">
            <InfoRow label="District" value={project.district} icon={Building2} />
            <InfoRow label="Project Type" value={project.projectType || project.dprType} icon={Tag} />
            <InfoRow label="Financial Year" value={project.financialYear} icon={Calendar} />
            <InfoRow 
              label="Department" 
              value={project.department} 
              icon={User} 
            />
            {project.makerUserId && (
              <InfoRow 
                label="Created By (Maker)" 
                value={project.makerUserId?.name || '—'} 
                icon={User} 
              />
            )}
          </div>
        </Card>

        {/* Budget Breakdown */}
        <Card>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Budget Breakdown</h3>
          <BudgetBar
            label="Total Sanctioned"
            value={project.totalSanctionedBudgetLakh}
            total={project.totalSanctionedBudgetLakh}
            color="bg-indigo-500"
          />
          <BudgetBar
            label="SARRA Share"
            value={project.sarraShareLakh}
            total={project.totalSanctionedBudgetLakh}
            color="bg-emerald-500"
          />
          <BudgetBar
            label="Dept. Share"
            value={project.deptShareLakh}
            total={project.totalSanctionedBudgetLakh}
            color="bg-orange-400"
          />
          {project.allocatedAmountLakh > 0 && (
            <BudgetBar
              label="Allocated to District"
              value={project.allocatedAmountLakh}
              total={project.totalSanctionedBudgetLakh}
              color="bg-cyan-500"
            />
          )}
        </Card>

        {/* Sanctioned Targets */}
        {project.sanctionedTargets?.length > 0 && (
          <Card>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
              Sanctioned Targets ({project.sanctionedTargets.length} components)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Activity</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Unit</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Target</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Amount (L)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {project.sanctionedTargets.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-700 font-medium">{t.activityLabel || t.activityId}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{t.unit}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-800">{t.physicalTarget}</td>
                      <td className="px-3 py-2 text-right font-semibold text-emerald-700">
                        ₹{(t.financialAmountLakh || 0).toFixed(2)}L
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Documents */}
        {(project.secretariatApprovalOrder?.url || project.stateSanctionOrder?.url || project.fundAllocationOrder?.url) && (
          <Card>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Documents</h3>
            <div className="space-y-2">
              {project.secretariatApprovalOrder?.url && (
                <a
                  href={project.secretariatApprovalOrder.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-navy hover:underline font-medium"
                >
                  <FileText className="w-4 h-4" /> Secretariat Approval Order
                </a>
              )}
              {project.stateSanctionOrder?.url && (
                <a
                  href={project.stateSanctionOrder.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-navy hover:underline font-medium"
                >
                  <FileText className="w-4 h-4" /> State Sanction Order
                </a>
              )}
              {project.fundAllocationOrder?.url && (
                <a
                  href={project.fundAllocationOrder.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-navy hover:underline font-medium"
                >
                  <FileText className="w-4 h-4" /> Fund Allocation Order
                </a>
              )}
            </div>
          </Card>
        )}

        {/* PIA Info */}
        {project.forwardedToPIA && (
          <Card>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">PIA Assignment</h3>
            <InfoRow label="Assigned PIA Officer" value={project.forwardedToPIA?.name} icon={User} />
            <InfoRow label="Department" value={project.forwardedToPIA?.department} icon={Building2} />
            <InfoRow label="Assigned On" value={formatDate(project.piaForwardedAt)} icon={Calendar} />
            {project.piaAcceptedAt && (
              <InfoRow label="Accepted On" value={formatDate(project.piaAcceptedAt)} icon={Calendar} />
            )}
          </Card>
        )}

        {/* Action Area */}
        {actions && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Actions</h3>
            {actions}
          </div>
        )}
      </div>

      {/* Right: Workflow Timeline */}
      <div>
        <Card noPadding>
          <CardHeader title="Workflow History" />
          <div className="p-4">
            <WorkflowTimeline history={project.workflowHistory || []} />
          </div>
        </Card>
      </div>
    </div>
  );
}
