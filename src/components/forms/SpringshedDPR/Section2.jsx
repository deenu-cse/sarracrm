import React from 'react';
import { FloatInput } from '../shared/FloatInput';
import { FloatSelect } from '../shared/FloatSelect';
import { DISTRICTS } from '@/constants/districts';
import { OWNERSHIP_TYPES } from '@/constants/form';

export default function Section2({ data, onChange, errors }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800">2. Spring Identification Details</h2>
        <p className="text-sm text-slate-500 mt-1">Geographic and administrative location of the spring.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FloatSelect
          id="district"
          label="District"
          options={DISTRICTS}
          value={data?.district || ''}
          onChange={handleChange}
          error={errors?.district}
          required
        />

        <FloatInput
          id="block"
          label="Block"
          value={data?.block || ''}
          onChange={handleChange}
          error={errors?.block}
          required
        />

        <FloatInput
          id="gramPanchayat"
          label="Gram Panchayat"
          value={data?.gramPanchayat || ''}
          onChange={handleChange}
          error={errors?.gramPanchayat}
          required
        />

        <FloatInput
          id="village"
          label="Village/Habitation"
          value={data?.village || ''}
          onChange={handleChange}
          error={errors?.village}
          required
        />

        <FloatInput
          id="latitude"
          label="Latitude (Decimal Degrees)"
          type="number"
          value={data?.latitude || ''}
          onChange={handleChange}
          error={errors?.latitude}
          placeholder="e.g. 30.3165"
          required
        />

        <FloatInput
          id="longitude"
          label="Longitude (Decimal Degrees)"
          type="number"
          value={data?.longitude || ''}
          onChange={handleChange}
          error={errors?.longitude}
          placeholder="e.g. 78.0322"
          required
        />

        <FloatInput
          id="elevation"
          label="Elevation (meters)"
          type="number"
          value={data?.elevation || ''}
          onChange={handleChange}
          error={errors?.elevation}
          required
        />

        <FloatSelect
          id="ownership"
          label="Land Ownership"
          options={OWNERSHIP_TYPES}
          value={data?.ownership || ''}
          onChange={handleChange}
          error={errors?.ownership}
          required
        />
      </div>
    </div>
  );
}
