"use client";
import React from 'react';
import { UserManagementPage } from '@/components/users/UserManagementPage';

/** District SARRA Centre: District and PIA accounts of the district. The District Maker requests, the District Approver approves. */
export default function DistrictUsersPage() {
  return <UserManagementPage newHref="/dashboard/dd/users/new" />;
}
