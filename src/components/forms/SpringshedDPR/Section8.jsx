import React from 'react';
import { FloatInput } from '../shared/FloatInput';

export default function Section8({ data, onChange, errors }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800">8. Recharge Area Interventions</h2>
        <p className="text-sm text-slate-500 mt-1">Planned physical interventions in the recharge zone.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FloatInput
          id="trenches"
          label="No. of Trenches Proposed"
          type="number"
          value={data?.trenches || ''}
          onChange={handleChange}
          error={errors?.trenches}
        />

        <FloatInput
          id="plantations"
          label="No. of Plantations Proposed"
          type="number"
          value={data?.plantations || ''}
          onChange={handleChange}
          error={errors?.plantations}
        />

        <FloatInput
          id="checkDams"
          label="No. of Check Dams"
          type="number"
          value={data?.checkDams || ''}
          onChange={handleChange}
          error={errors?.checkDams}
        />

        <FloatInput
          id="percolationPits"
          label="No. of Percolation Pits"
          type="number"
          value={data?.percolationPits || ''}
          onChange={handleChange}
          error={errors?.percolationPits}
        />
      </div>
    </div>
  );
}
