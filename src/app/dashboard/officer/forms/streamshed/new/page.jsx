import React from 'react';
import StreamshedDPRForm from '@/components/forms/StreamshedDPR';

export const metadata = {
  title: 'New Streamshed DPR | SARRA CRM'
};

export default function NewStreamshedDPRPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <StreamshedDPRForm />
    </div>
  );
}
