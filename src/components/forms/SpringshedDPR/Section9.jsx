import React from 'react';
import { FloatInput } from '../shared/FloatInput';
import { FloatSelect } from '../shared/FloatSelect';

export default function Section9({ data, onChange, errors }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800">9. Community Initiatives</h2>
        <p className="text-sm text-slate-500 mt-1">Details about community mobilization and capacity building.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FloatSelect
          id="waterCommitteeFormed"
          label="Water User Committee Formed?"
          options={['Yes', 'No', 'In Progress']}
          value={data?.waterCommitteeFormed || ''}
          onChange={handleChange}
          error={errors?.waterCommitteeFormed}
        />

        <FloatInput
          id="committeeMembers"
          label="No. of Committee Members"
          type="number"
          value={data?.committeeMembers || ''}
          onChange={handleChange}
          error={errors?.committeeMembers}
        />

        <FloatInput
          id="trainingPrograms"
          label="Planned Training Programs"
          type="number"
          value={data?.trainingPrograms || ''}
          onChange={handleChange}
          error={errors?.trainingPrograms}
        />
      </div>
    </div>
  );
}
