import React from 'react';
import { Check } from 'lucide-react';

const steps = [
  { id: 1, label: 'Dept Details' },
  { id: 2, label: 'Stream ID' },
  { id: 3, label: 'Catchment' },
  { id: 4, label: 'Photos' },
  { id: 5, label: 'Recharge' },
  { id: 6, label: 'Maps' },
  { id: 7, label: 'Budget' },
  { id: 8, label: 'Geo Location' },
];

export const StepIndicator = ({ currentStep, onStepClick }) => {
  return (
    <div className="mb-8 overflow-x-auto">
      <div className="flex items-center min-w-[800px] py-4">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center relative z-10" onClick={() => onStepClick(step.id)}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm border-2 cursor-pointer transition-colors ${isCompleted ? 'bg-green-500 border-green-500 text-white' : isCurrent ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-400 hover:border-blue-400'}`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <span className={`text-xs font-medium mt-2 absolute -bottom-6 w-24 text-center ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-slate-400'}`}>{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.id ? 'bg-green-500' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
