"use client";
import React from 'react';
import { UserInviteForm } from '@/components/users/UserInviteForm';

export default function InviteUserPage() {
  return <UserInviteForm listHref="/dashboard/admin/users" />;
}
