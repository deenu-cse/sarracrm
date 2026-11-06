"use client";
import React from 'react';
import { UserInviteForm } from '@/components/users/UserInviteForm';

export default function DistrictRequestUserPage() {
  return <UserInviteForm listHref="/dashboard/dd/users" />;
}
