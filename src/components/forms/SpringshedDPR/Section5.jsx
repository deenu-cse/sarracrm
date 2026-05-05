import React from 'react';
import { FloatInput } from '../shared/FloatInput';
import { FloatSelect } from '../shared/FloatSelect';
import { GEOLOGICAL_ROCK_TYPES } from '@/constants/form';

export default function Section5({ data, onChange, errors }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800">5. Hydro-Geological Details</h2>
        <p className="text-sm text-slate-500 mt-1">Geological features and catchment area details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FloatSelect
          id="rockType"
          label="Major Rock Type"
          options={GEOLOGICAL_ROCK_TYPES}
          value={data?.rockType || ''}
          onChange={handleChange}
          error={errors?.rockType}
          required
        />

        <FloatInput
          id="soilType"
          label="Soil Type"
          value={data?.soilType || ''}
          onChange={handleChange}
          error={errors?.soilType}
          required
        />

        <FloatInput
          id="catchmentArea"
          label="Catchment Area (Hectares)"
          type="number"
          value={data?.catchmentArea || ''}
          onChange={handleChange}
          error={errors?.catchmentArea}
          required
        />

        <FloatInput
          id="slopeAngle"
          label="Average Slope Angle (Degrees)"
          type="number"
          value={data?.slopeAngle || ''}
          onChange={handleChange}
          error={errors?.slopeAngle}
        />
      </div>
    </div>
  );
}
