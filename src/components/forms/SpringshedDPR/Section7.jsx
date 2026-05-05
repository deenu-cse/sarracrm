import React from 'react';
import { FloatInput } from '../shared/FloatInput';
import { CheckGroup } from '../shared/CheckGroup';

export default function Section7({ data, onChange, errors }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  const handleChallengesChange = (values) => {
    onChange({ challenges: values });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800">7. Other Information</h2>
        <p className="text-sm text-slate-500 mt-1">Challenges and other observations.</p>
      </div>

      <CheckGroup
        label="Primary Challenges Observed"
        options={[
          'Decreasing Discharge',
          'Drying up in Summer',
          'Water Quality Degradation',
          'Catchment Degradation',
          'Infrastructure Damage',
          'Dispute over usage'
        ]}
        selectedValues={data?.challenges || []}
        onChange={handleChallengesChange}
        error={errors?.challenges}
      />

      <div className="mt-6">
        <FloatInput
          id="otherObservations"
          label="Other Observations / Remarks"
          value={data?.otherObservations || ''}
          onChange={handleChange}
          error={errors?.otherObservations}
        />
      </div>
    </div>
  );
}
