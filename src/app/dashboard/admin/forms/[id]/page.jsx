"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { useFormDetail } from '@/hooks/useFormDetail';
import { PremiumDPRView } from '@/components/review/PremiumDPRView';
import { ApprovalPanel } from '@/components/review/ApprovalPanel';
import { RevisionTimeline } from '@/components/review/RevisionTimeline';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminFormViewPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const { form, loading, error } = useFormDetail(id);

  if (loading) return <FullPageSpinner />;
  
  if (error || !form) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Form Not Found</h2>
        <p className="text-slate-500 mt-2 max-w-md mx-auto">{error || "The requested DPR details could not be retrieved."}</p>
        <Button onClick={() => router.push('/dashboard/admin/forms')} className="mt-8 rounded-2xl px-8" variant="secondary">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Forms
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1700px] mx-auto min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content Area */}
        <div className="flex-1">
          <div className="mb-6 flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard/admin/forms')} className="p-2 w-auto h-auto rounded-xl">
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </Button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                DPR Review Center
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Viewing: {form.applicationNo}
              </p>
            </div>
          </div>

          <PremiumDPRView dpr={form} />
        </div>
        
        {/* Review Sidebar */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="sticky top-8 space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-200">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-400" />
                Administrative View
              </h3>
              <ApprovalPanel 
                form={form} 
                isReadOnly={true}
              />
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Revision Timeline</h4>
              <RevisionTimeline revisions={form.timeline || []} currentStatus={form.status} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
