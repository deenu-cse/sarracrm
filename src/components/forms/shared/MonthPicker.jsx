import React from 'react';
import { FloatInput } from './FloatInput';

export function MonthPicker({ id, label, value, onChange, required = false, disabled = false, error }) {
  // We use type="month" for native browser month picker
  return (
    <FloatInput
      type="month"
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      error={error}
    />
  );
}
