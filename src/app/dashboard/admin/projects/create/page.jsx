"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { post } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DISTRICTS } from '@/constants/districts';
import { DEPARTMENTS } from '@/constants/departments';
import { ChevronLeft, Plus, Trash2, FolderPlus, IndianRupee } from 'lucide-react';
import Link from 'next/link';

const PROJECT_TYPES = ['SPRINGSHED', 'STREAMSHED', 'GROUNDWATER'];
const FINANCIAL_YEARS = ['2023-2024', '2024-2025', '2025-2026', '2026-2027'];

const DEFAULT_ACTIVITY = { activityId: '', activityLabel: '', unit: 'Nos.', physicalTarget: 0, financialAmountLakh: 0 };

const UNITS = ['Nos.', 'Ha.', 'Km.', 'Mtrs', 'Cu.m', 'Ltr/Day', 'RM', 'Lump Sum'];

export default function CreateProjectPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    projectTitle: '',
    projectType: 'SPRINGSHED',
    financialYear: '2025-2026',
    district: DISTRICTS[0],
    department: DEPARTMENTS[0],
    makerNote: '',
    totalSanctionedBudgetLakh: 0,
    deptShareLakh: 0,
    sarraShareLakh: 0,
    sanctionedTargets: [{ ...DEFAULT_ACTIVITY }],
  });

  const updateField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const updateTarget = (i, k, v) => {
    setForm(prev => {
      const targets = [...prev.sanctionedTargets];
      targets[i] = { ...targets[i], [k]: v };
      return { ...prev, sanctionedTargets: targets };
    });
  };

  const addTarget = () =>
    setForm(prev => ({ ...prev, sanctionedTargets: [...prev.sanctionedTargets, { ...DEFAULT_ACTIVITY }] }));

  const removeTarget = (i) =>
    setForm(prev => ({ ...prev, sanctionedTargets: prev.sanctionedTargets.filter((_, idx) => idx !== i) }));

  const calcTotal = () =>
    form.sanctionedTargets.reduce((s, t) => s + Number(t.financialAmountLakh || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        totalSanctionedBudgetLakh: calcTotal(),
      };
      const res = await post('/sanctions', payload);
      if (res?.success) {
        router.push('/dashboard/admin/projects');
      } else {
        setError(res?.message || 'Failed to create project');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/admin/projects" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <FolderPlus className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Create New Project</h1>
            <p className="text-slate-500 text-sm">This will enter the Checker → Approver → District → PIA workflow</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader title="Project Information" />
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Project Title *</label>
              <input
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
                placeholder="e.g., Springshed Development in Almora - Batch 1"
                value={form.projectTitle}
                onChange={e => updateField('projectTitle', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Project Type *</label>
              <select
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                value={form.projectType}
                onChange={e => updateField('projectType', e.target.value)}
              >
                {PROJECT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Financial Year *</label>
              <select
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                value={form.financialYear}
                onChange={e => updateField('financialYear', e.target.value)}
              >
                {FINANCIAL_YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">District *</label>
              <select
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                value={form.district}
                onChange={e => updateField('district', e.target.value)}
              >
                {DISTRICTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                value={form.department}
                onChange={e => updateField('department', e.target.value)}
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Maker Note</label>
              <textarea
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none bg-white"
                placeholder="Optional note about this project creation..."
                value={form.makerNote}
                onChange={e => updateField('makerNote', e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Budget */}
        <Card>
          <CardHeader title="Budget Details" />
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">SARRA Share (Lakh)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  value={form.sarraShareLakh}
                  onChange={e => updateField('sarraShareLakh', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department Share (Lakh)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  value={form.deptShareLakh}
                  onChange={e => updateField('deptShareLakh', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="md:col-span-2 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <p className="text-sm text-indigo-700 font-semibold">
                Total Budget (computed from targets): ₹{calcTotal().toFixed(2)} Lakh
              </p>
            </div>
          </div>
        </Card>

        {/* Sanctioned Targets */}
        <Card>
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Sanctioned Targets</h3>
              <p className="text-sm text-slate-500">Define component-wise activity targets</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addTarget} className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add Component
            </Button>
          </div>
          <div className="p-6 space-y-4">
            {form.sanctionedTargets.map((target, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Component #{i + 1}
                  </span>
                  {form.sanctionedTargets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTarget(i)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Activity Label *</label>
                    <input
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                      placeholder="e.g., Spring Box Construction"
                      value={target.activityLabel}
                      onChange={e => updateTarget(i, 'activityLabel', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Unit</label>
                    <select
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                      value={target.unit}
                      onChange={e => updateTarget(i, 'unit', e.target.value)}
                    >
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Physical Target</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                      value={target.physicalTarget}
                      onChange={e => updateTarget(i, 'physicalTarget', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (Lakh) *</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full border border-slate-200 rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        value={target.financialAmountLakh}
                        onChange={e => updateTarget(i, 'financialAmountLakh', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3 pb-8">
          <Link href="/dashboard/admin/projects">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Creating Project...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </div>
  );
}
