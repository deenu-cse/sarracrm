import React from 'react';
import { FloatInput } from '../shared/FloatInput';

export default function Section6({ data, onChange, errors }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800">6. Physical Characteristics</h2>
        <p className="text-sm text-slate-500 mt-1">Water quality and physical parameters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FloatInput
          id="phLevel"
          label="pH Level"
          type="number"
          value={data?.phLevel || ''}
          onChange={handleChange}
          error={errors?.phLevel}
        />

        <FloatInput
          id="temperature"
          label="Temperature (°C)"
          type="number"
          value={data?.temperature || ''}
          onChange={handleChange}
          error={errors?.temperature}
        />

        <FloatInput
          id="tds"
          label="TDS (mg/L)"
          type="number"
          value={data?.tds || ''}
          onChange={handleChange}
          error={errors?.tds}
        />

        <FloatInput
          id="turbidity"
          label="Turbidity (NTU)"
          type="number"
          value={data?.turbidity || ''}
          onChange={handleChange}
          error={errors?.turbidity}
        />
      </div>
    </div>
  );
}
