"use client";
import React from 'react';
import Link from 'next/link';
import { Badge } from './Badge';
import { formatDate } from '@/lib/formatters';
import { ExternalLink, IndianRupee } from 'lucide-react';

/**
 * Reusable projects table component.
 * @param {Array} projects - array of ProjectSanction documents
 * @param {string} detailBasePath - base path for detail page link e.g. "/dashboard/admin/projects"
 * @param {Array} extraColumns - additional column definitions [{ key, label, render }]
 */
export function ProjectsTable({ projects = [], detailBasePath = '', extraColumns = [], loading = false }) {
  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="p-10 text-center text-slate-400">
        <div className="text-4xl mb-3">📋</div>
        <p className="font-medium">No projects found</p>
        <p className="text-sm mt-1">Projects will appear here once created.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs">Sanction ID / Project</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs">District</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs">Type</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs">Budget (Lakh)</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs">Status</th>
            {extraColumns.map(col => (
              <th key={col.key} className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs">
                {col.label}
              </th>
            ))}
            <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs">Date</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {projects.map(project => (
            <tr key={project._id} className="hover:bg-slate-50 transition-colors group">
              <td className="px-4 py-4">
                <p className="font-mono text-xs font-bold text-slate-500">
                  {project.sanctionId || <span className="text-slate-300 italic">Pending</span>}
                </p>
                {project.projectId && (
                  <p className="font-mono text-xs text-slate-500 mt-0.5">{project.projectId}</p>
                )}
                <p className="font-medium text-slate-800 mt-0.5 line-clamp-1">{project.projectTitle || '—'}</p>
                <p className="text-xs text-slate-400 mt-0.5">{project.financialYear}</p>
              </td>
              <td className="px-4 py-4 text-slate-700 font-medium">{project.district}</td>
              <td className="px-4 py-4">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                  {project.projectType || project.dprType || '—'}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-1 text-slate-800 font-semibold">
                  <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                  {(project.totalSanctionedBudgetLakh || 0).toFixed(2)}L
                </div>
                {project.sarraShareLakh > 0 && (
                  <p className="text-xs text-slate-400">SARRA: ₹{(project.sarraShareLakh).toFixed(2)}L</p>
                )}
              </td>
              <td className="px-4 py-4">
                <Badge status={project.status} />
                {project.isActive && (
                  <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500 text-white">
                    ACTIVE
                  </span>
                )}
              </td>
              {extraColumns.map(col => (
                <td key={col.key} className="px-4 py-4 text-slate-600">
                  {col.render ? col.render(project) : project[col.key] ?? '—'}
                </td>
              ))}
              <td className="px-4 py-4 text-xs text-slate-400">
                {formatDate(project.createdAt)}
              </td>
              <td className="px-4 py-4">
                {detailBasePath && (
                  <Link
                    href={`${detailBasePath}/${project._id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-navy hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
