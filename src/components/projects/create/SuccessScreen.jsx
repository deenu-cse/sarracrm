"use client";
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ActionButton, SuccessTick } from './parts';

const COPY = {
  create: { heading: 'Project Created Successfully', text: 'Your project has been successfully created and sent to the Checker for verification.' },
  resubmit: { heading: 'Project Resubmitted', text: 'The corrected project has been sent to the Checker for verification.' },
  revise: { heading: 'Revision Sent for Review', text: 'The revised estimate has been sent to the Checker. The project keeps its current figures until the Approver approves the revision.' },
};

/** Final confirmation shown after the wizard has saved. */
export function SuccessScreen({ project, mode = 'create', source, onCreateAnother }) {
  const headingRef = useRef(null);
  useEffect(() => { headingRef.current?.focus(); }, []);

  const copy = COPY[mode] || COPY.create;
  const projectId = mode === 'create' ? project?.projectId : (source?.code || project?.projectId);
  const dbId = mode === 'create' ? project?._id : source?.id;
  const detailHref = dbId ? `/dashboard/admin/projects/${dbId}${mode === 'revise' ? '#workflow' : ''}` : '/dashboard/admin/projects';

  return (
    <div className="wz-fade-in mx-auto max-w-xl rounded-xl border border-slate-200 bg-white px-8 py-12 text-center shadow-sm" role="status">
      <div className="flex justify-center"><SuccessTick size={72} /></div>
      <h1 ref={headingRef} tabIndex={-1} className="mt-6 text-2xl font-bold text-slate-900 focus:outline-none">{copy.heading}</h1>

      <div className="mx-auto mt-6 inline-block rounded-lg border border-slate-200 bg-slate-50 px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Project ID</p>
        <p className="mt-1 font-mono text-2xl font-bold tracking-wide text-slate-900">{projectId}</p>
        {mode === 'revise' && project?.revisionNo && <p className="mt-1 text-xs font-semibold text-slate-600">Revision {project.revisionNo}</p>}
      </div>

      <p className="mt-6 text-sm text-slate-600">{copy.text}</p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={detailHref}
          className="inline-flex items-center justify-center rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-navy-light hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:ring-offset-2"
        >
          View Project
        </Link>
        {mode === 'create' && <ActionButton variant="secondary" size="lg" icon={Plus} onClick={onCreateAnother}>Create Another Project</ActionButton>}
      </div>
    </div>
  );
}
