import React from 'react';
import Link from 'next/link';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  BarChart2, 
  AlertTriangle, 
  ArrowRight,
  Settings,
  Bell,
  FilePlus
} from 'lucide-react';
import { USER_ROLES } from '@/constants/roles';

export function QuickActions({ role }) {
  const actions = {
    [USER_ROLES.PIA_OFFICER]: [
      { title: 'New Submission', desc: 'Create a new MPR report', icon: FilePlus, href: '/dashboard/officer/mpr/new', color: 'bg-[#0a3d62] hover:bg-[#1a5276] text-white' },
      { title: 'My Reports', desc: 'Track your submission status', icon: Clock, href: '/dashboard/officer/mpr', color: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' },
      { title: 'Analytics', desc: 'View your district trends', icon: BarChart2, href: '/dashboard/officer/analytics', color: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' }
    ],
    [USER_ROLES.DD_LEVEL]: [
      { title: 'Review Forms', desc: 'Approve or reject submissions', icon: CheckCircle, href: '/dashboard/dd/review', color: 'bg-[#0a3d62] hover:bg-[#1a5276] text-white' },
      { title: 'District Intel', desc: 'View aggregated performance', icon: BarChart2, href: '/dashboard/dd/analytics', color: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' },
      { title: 'Alerts', desc: 'System notifications', icon: Bell, href: '/dashboard/dd/notifications', color: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' }
    ],
    [USER_ROLES.MND_OFFICER]: [
      { title: 'My MPRs', desc: 'Manage your monthly reports', icon: FileText, href: '/dashboard/mnd/mpr', color: 'bg-[#0a3d62] hover:bg-[#1a5276] text-white' },
      { title: 'Analytics', desc: 'Deep dive into report data', icon: BarChart2, href: '/dashboard/mnd/analytics', color: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' },
      { title: 'Support', desc: 'Get help with submissions', icon: Settings, href: '/dashboard/mnd/support', color: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' }
    ],
    MND_SUPER_ADMIN: [
      { title: 'Approve MPRs', desc: 'Review state-wide submissions', icon: CheckCircle, href: '/dashboard/mnd-admin/mpr', color: 'bg-[#0a3d62] hover:bg-[#1a5276] text-white' },
      { title: 'State Intelligence', desc: 'Advanced analytics & trends', icon: BarChart2, href: '/dashboard/mnd-admin/analytics', color: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' },
      { title: 'System Health', desc: 'Monitor activity and logs', icon: ActivityIcon, href: '/dashboard/mnd-admin/activity', color: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' }
    ]
  };

  const currentActions = actions[role] || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {currentActions.map((action, idx) => (
        <Link 
          key={idx} 
          href={action.href}
          className={`p-5 rounded-2xl transition-all group relative overflow-hidden flex flex-col justify-between h-36 ${action.color}`}
        >
          <div className="flex justify-between items-start">
            <div className={`p-2.5 rounded-xl ${action.color.includes('text-white') ? 'bg-white/10' : 'bg-slate-100'}`}>
              <action.icon className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">{action.title}</h3>
            <p className={`text-xs mt-1 font-medium ${action.color.includes('text-white') ? 'text-white/60' : 'text-slate-500'}`}>
              {action.desc}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ActivityIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  );
}
