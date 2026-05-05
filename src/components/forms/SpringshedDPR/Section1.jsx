import React from 'react';
import { FloatInput } from '../shared/FloatInput';
import { FloatSelect } from '../shared/FloatSelect';
import { DEPARTMENTS } from '@/constants/departments';

export default function Section1({ data, onChange, errors }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800">1. Department Details</h2>
        <p className="text-sm text-slate-500 mt-1">Information about the executing agency and officer.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FloatSelect
          id="executingDepartment"
          label="Executing Department"
          options={DEPARTMENTS}
          value={data?.executingDepartment || ''}
          onChange={handleChange}
          error={errors?.executingDepartment}
          required
        />

        <FloatSelect
          id="typeOfPia"
          label="Type of PIA"
          options={['Government', 'NGO', 'Community Based Organization', 'Other']}
          value={data?.typeOfPia || ''}
          onChange={handleChange}
          error={errors?.typeOfPia}
          required
        />

        <FloatInput
          id="nameOfOfficer"
          label="Name of Officer"
          value={data?.nameOfOfficer || ''}
          onChange={handleChange}
          error={errors?.nameOfOfficer}
          required
        />

        <FloatInput
          id="designation"
          label="Designation"
          value={data?.designation || ''}
          onChange={handleChange}
          error={errors?.designation}
          required
        />

        <FloatInput
          id="mobileNumber"
          label="Mobile Number"
          type="tel"
          value={data?.mobileNumber || ''}
          onChange={handleChange}
          error={errors?.mobileNumber}
          required
        />

        <FloatInput
          id="email"
          label="Email Address"
          type="email"
          value={data?.email || ''}
          onChange={handleChange}
          error={errors?.email}
          required
        />
      </div>
    </div>
  );
}
