"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NAV_LINKS } from '@/constants/nav';
import { USER_ROLES } from '@/constants/roles';

export function NavLinks({ mobile = false, onClick }) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user || !user.role) return null;

  const isPureSuperAdmin =
    user.role === USER_ROLES.SUPER_ADMIN &&
    (user.workflowRole == null || user.workflowRole === '');

  let links = NAV_LINKS[user.role] || [];

  if (user.role === USER_ROLES.SUPER_ADMIN && !isPureSuperAdmin) {
    links = links.filter((link) => link.href !== '/dashboard/admin/users');
  }

  return (
    <div className={mobile ? 'flex flex-col gap-1' : 'flex items-baseline space-x-2'}>
      {links.map((link) => {
        const isActive =
          pathname === link.href ||
          (pathname.startsWith(link.href) &&
            link.href !== '/dashboard/officer' &&
            link.href !== '/dashboard/dd' &&
            link.href !== '/dashboard/admin');

        return (
          <Link
            key={link.label}
            href={link.href}
            onClick={onClick}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${mobile ? 'block w-full text-left' : ''}
              ${
                isActive
                  ? 'bg-blue-700 text-white shadow-inner'
                  : 'text-blue-200 hover:bg-blue-700 hover:text-white'
              }
            `}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
