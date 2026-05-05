import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

export function StepIndicator({ currentStep, totalSteps, onStepClick, stepStatus = {} }) {
  // stepStatus: { 1: 'completed', 2: 'error', 3: 'current', 4: 'pending' }
  
  return (
    <div className="w-full py-4 mb-8 overflow-x-auto scrollbar-hide">
      <div className="flex items-center min-w-[800px] px-2">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNum = index + 1;
          const status = stepStatus[stepNum] || (stepNum === currentStep ? 'current' : stepNum < currentStep ? 'completed' : 'pending');
          const isCurrent = stepNum === currentStep;
          
          let bgColor = 'bg-slate-200 text-slate-500';
          let borderColor = 'border-slate-200';
          
          if (status === 'completed') {
            bgColor = 'bg-navy text-white';
            borderColor = 'border-navy';
          } else if (status === 'current') {
            bgColor = 'bg-white border-2 border-navy text-navy font-bold';
            borderColor = 'border-navy';
          } else if (status === 'error') {
            bgColor = 'bg-red-50 text-red-500 border border-red-500';
            borderColor = 'border-red-200';
          }

          return (
            <React.Fragment key={stepNum}>
              <div className="flex flex-col items-center relative">
                <button
                  type="button"
                  onClick={() => onStepClick(stepNum)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${bgColor} ${isCurrent ? 'scale-110 shadow-md' : 'hover:bg-slate-100'}`}
                  title={`Step ${stepNum}`}
                >
                  {status === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : status === 'error' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <span>{stepNum}</span>
                  )}
                </button>
                <span className={`absolute -bottom-6 w-20 text-center text-xs font-medium ${isCurrent ? 'text-navy' : 'text-slate-500'}`}>
                  Section {stepNum}
                </span>
              </div>
              
              {stepNum < totalSteps && (
                <div className="flex-1 mx-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${status === 'completed' ? 'bg-navy' : 'bg-transparent'}`} 
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
