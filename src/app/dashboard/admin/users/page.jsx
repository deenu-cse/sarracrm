"use client";
import React from 'react';
import { UserManagementPage } from '@/components/users/UserManagementPage';

/** SARRA HQ: every account. The administrator invites directly, the HQ Maker requests and the HQ Approver approves. */
export default function AdminUsersPage() {
  return <UserManagementPage newHref="/dashboard/admin/users/new" />;
}
