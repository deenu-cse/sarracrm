"use client";
import OfficerNotificationsPage from '../../officer/notifications/page';

export default function DDNotificationsPage() {
  // Using the same component for DD level notifications since layout/logic is identical
  // The API automatically scopes to the user
  return <OfficerNotificationsPage />;
}
