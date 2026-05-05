import React from 'react';
import { FloatInput } from '../shared/FloatInput';
import { FloatSelect } from '../shared/FloatSelect';
import { SPRING_TYPES, LAND_USE_TYPES } from '@/constants/form';

export default function Section3({ data, onChange, errors }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800">3. Spring Description</h2>
        <p className="text-sm text-slate-500 mt-1">Basic characteristics and usage of the spring.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FloatInput
          id="localName"
          label="Local Name of Spring (if any)"
          value={data?.localName || ''}
          onChange={handleChange}
          error={errors?.localName}
        />

        <FloatSelect
          id="springType"
          label="Type of Spring"
          options={SPRING_TYPES}
          value={data?.springType || ''}
          onChange={handleChange}
          error={errors?.springType}
          required
        />

        <FloatSelect
          id="landUse"
          label="Land Use around Spring"
          options={LAND_USE_TYPES}
          value={data?.landUse || ''}
          onChange={handleChange}
          error={errors?.landUse}
          required
        />

        <FloatInput
          id="dependents"
          label="No. of Dependent Households"
          type="number"
          value={data?.dependents || ''}
          onChange={handleChange}
          error={errors?.dependents}
          required
        />

        <FloatInput
          id="dischargeLpm"
          label="Average Discharge (Liters per min)"
          type="number"
          value={data?.dischargeLpm || ''}
          onChange={handleChange}
          error={errors?.dischargeLpm}
          required
        />
      </div>
    </div>
  );
}
