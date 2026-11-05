"use client";
import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ClipboardPlus } from 'lucide-react';
import { ProjectDetailView } from '@/components/projects/detail/ProjectDetailView';
import { DistrictActions } from '@/components/projects/detail/DistrictActions';

const districtEntryFor = (project, user) => (project.departmentAllocations || []).some((d) => d.reportingMode === 'DISTRICT'
  && String(d.districtStaffUserId?._id || d.districtStaffUserId || '') === String(user?._id || user?.id || ''));

/** District project detail: the District Maker accepts it and assigns the PIA and reporting responsibility; everyone follows progress. */
export default function DDProjectDetailPage() {
  const { id } = useParams();
  return (
    <ProjectDetailView
      projectId={id}
      backHref="/dashboard/dd/projects"
      renderActions={({ project, user, refresh }) => (
        <>
          <DistrictActions project={project} user={user} onDone={refresh} />
          {districtEntryFor(project, user) && (
            <Link
              href={`/dashboard/dd/mprs/new?projectId=${project._id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-navy-light hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:ring-offset-2"
            >
              <ClipboardPlus className="h-4 w-4" aria-hidden="true" /> File District Entry MPR
            </Link>
          )}
        </>
      )}
      mprHref={(mpr) => `/dashboard/dd/mpr-review/project/${mpr.id}`}
    />
  );
}
