"use client";
import React from 'react';
import { useFormDetail } from '@/hooks/useFormDetail';
import SpringshedDPRForm from '@/components/forms/SpringshedDPR';
import StreamshedDPRForm from '@/components/forms/StreamshedDPR';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function EditFormPage({ params }) {
  const { id } = params;
  const { form, loading, error } = useFormDetail(id);
  const router = useRouter();

  if (loading) return <FullPageSpinner />;

  if (error || !form) return <div className="p-6"><div className="border border-red-200 bg-red-50 text-red-700 rounded-xl p-4">{error || "Unable to load form"} <button onClick={() => window.location.reload()} className="underline ml-2">Retry</button></div></div>;

  // Double check if editable
  if (form.status !== 'DRAFT' && form.status !== 'REJECTED') {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center mt-10">
        <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Cannot Edit Form</h2>
        <p className="text-slate-600 mt-2 max-w-md mx-auto">
          This form is currently in <strong>{form.status}</strong> status and cannot be edited.
          Only DRAFT and REJECTED forms can be modified.
        </p>
        <Button onClick={() => router.push(`/dashboard/officer/forms/${id}`)} className="mt-6" variant="primary">
          View Form Details
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {form.formType === 'STREAMSHED' ? (
        <StreamshedDPRForm initialData={form} isEdit={true} />
      ) : (
        <SpringshedDPRForm initialData={form} isEdit={true} />
      )}
    </div>
  );
}
