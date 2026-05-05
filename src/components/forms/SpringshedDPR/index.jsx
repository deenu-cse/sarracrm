"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { StepIndicator } from './StepIndicator';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { useUI } from '@/contexts/UIContext';
import { post, patch } from '@/lib/api';
import { useRouter } from 'next/navigation';

import Section1 from './Section1';
import Section2 from './Section2';
import Section3 from './Section3';
import Section4 from './Section4';
import Section5 from './Section5';
import Section6 from './Section6';
import Section7 from './Section7';
import Section8 from './Section8';
import Section9 from './Section9';
import Section10 from './Section10';

const TOTAL_STEPS = 10;

export default function SpringshedDPRForm({ initialData = null, isEdit = false }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialData || {});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  const { addToast } = useUI();
  const router = useRouter();

  // Auto-save draft every 30 seconds
  const autoSave = useCallback(async () => {
    if (isEdit) return; // Don't auto-save as draft if we are editing a rejected form
    try {
      const res = await post('/dpr/springshed/draft', formData);
      if (res?.success) {
        setLastSaved(new Date());
        if (res.data?._id && !formData._id) {
          setFormData(prev => ({ ...prev, _id: res.data._id }));
        }
      }
    } catch (e) {
      console.error('Auto-save failed', e);
    }
  }, [formData, isEdit]);

  useEffect(() => {
    if (isEdit) return;
    const timer = setInterval(() => {
      // Only auto-save if there's actual data
      if (Object.keys(formData).length > 0 && Object.keys(formData).some(key => Object.keys(formData[key] || {}).length > 0)) {
        autoSave();
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [formData, autoSave, isEdit]);

  const handleSectionChange = (sectionKey, newData) => {
    setFormData(prev => ({
      ...prev,
      [sectionKey]: {
        ...(prev[sectionKey] || {}),
        ...newData
      }
    }));
    // Clear errors for fields that are being updated
    if (errors[sectionKey]) {
      setErrors(prev => ({ ...prev, [sectionKey]: {} }));
    }
  };

  const validateCurrentStep = () => {
    // Basic validation implementation
    // In a real app, use Zod or Yup for rigorous validation
    const currentErrors = {};
    let isValid = true;
    
    // Simple required field check based on step
    if (currentStep === 1) {
      const d = formData.departmentDetails || {};
      if (!d.executingDepartment) currentErrors.executingDepartment = 'Required';
      if (!d.nameOfOfficer) currentErrors.nameOfOfficer = 'Required';
      if (!d.mobileNumber) currentErrors.mobileNumber = 'Required';
      if (!d.email) currentErrors.email = 'Required';
    } else if (currentStep === 2) {
      const d = formData.springIdentification || {};
      if (!d.district) currentErrors.district = 'Required';
      if (!d.latitude) currentErrors.latitude = 'Required';
      if (!d.longitude) currentErrors.longitude = 'Required';
    } else if (currentStep === 4) {
      const d = formData.photos || [];
      if (d.length < 2) currentErrors.photos = 'Please upload at least 2 photos';
    } else if (currentStep === 10) {
      const d = formData.financials || {};
      if (!d.activities || d.activities.length === 0) currentErrors.activities = 'Add at least one activity';
      if (!d.sarraShare) currentErrors.sarraShare = 'Required';
    }

    if (Object.keys(currentErrors).length > 0) {
      isValid = false;
      const stepKey = getSectionKey(currentStep);
      setErrors(prev => ({ ...prev, [stepKey]: currentErrors }));
      addToast('Please fill all required fields correctly', 'error');
    }

    return isValid;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = (step) => {
    if (step < currentStep) {
      setCurrentStep(step);
    } else if (step > currentStep && validateCurrentStep()) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    
    setIsSubmitting(true);
    try {
      const endpoint = isEdit ? `/dpr/springshed/${formData._id}/resubmit` : '/dpr/springshed/submit';
      const method = isEdit ? patch : post;
      
      const res = await method(endpoint, formData);
      
      if (res?.success) {
        addToast(isEdit ? 'Form resubmitted successfully!' : 'Form submitted successfully!', 'success');
        router.push('/dashboard/officer/forms');
      } else {
        addToast(res?.message || 'Submission failed', 'error');
      }
    } catch (e) {
      addToast('An error occurred during submission', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSectionKey = (step) => {
    const keys = [
      'departmentDetails', 'springIdentification', 'springDescription', 'photos',
      'hydroGeological', 'physicalCharacteristics', 'otherInformation', 
      'rechargeArea', 'communityInitiatives', 'financials'
    ];
    return keys[step - 1];
  };

  const renderCurrentStep = () => {
    const props = {
      data: formData[getSectionKey(currentStep)],
      onChange: (data) => handleSectionChange(getSectionKey(currentStep), data),
      errors: errors[getSectionKey(currentStep)] || {}
    };

    switch (currentStep) {
      case 1: return <Section1 {...props} />;
      case 2: return <Section2 {...props} />;
      case 3: return <Section3 {...props} />;
      case 4: return <Section4 {...props} />;
      case 5: return <Section5 {...props} />;
      case 6: return <Section6 {...props} />;
      case 7: return <Section7 {...props} />;
      case 8: return <Section8 {...props} />;
      case 9: return <Section9 {...props} />;
      case 10: return <Section10 {...props} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'Edit DPR Form' : 'New DPR Form'}</h1>
          <p className="text-slate-500">Springshed Rejuvenation Project</p>
        </div>
        {lastSaved && (
          <div className="flex items-center text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <Save className="w-3 h-3 mr-1.5 text-navy" />
            Auto-saved at {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>

      <StepIndicator 
        currentStep={currentStep} 
        totalSteps={TOTAL_STEPS} 
        onStepClick={handleStepClick} 
      />

      <Card>
        {renderCurrentStep()}

        <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-200">
          <Button
            variant="secondary"
            onClick={prevStep}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          
          {currentStep < TOTAL_STEPS ? (
            <Button
              variant="primary"
              onClick={nextStep}
              disabled={isSubmitting}
            >
              Save & Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={handleSubmit}
              loading={isSubmitting}
            >
              <Save className="w-4 h-4 mr-2" /> Submit DPR Form
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
