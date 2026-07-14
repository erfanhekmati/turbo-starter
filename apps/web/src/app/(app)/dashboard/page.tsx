'use client';

import { useCurrentUser } from '@/features/auth';
import { DashboardFileUpload } from '@/features/files/dashboard-file-upload';

export default function DashboardPage() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <p className="text-muted-foreground">Loading profile…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        {user ? (
          <div className="space-y-2 text-sm">
            <p>
              Welcome back, {user.firstName} {user.lastName}.
            </p>
            <p className="text-muted-foreground">{user.email}</p>
            <p>
              Roles:{' '}
              <span className="font-medium">
                {user.roles.join(', ') || 'none'}
              </span>
            </p>
            <p>
              Permissions:{' '}
              <span className="font-medium">
                {user.permissions.join(', ') || 'none'}
              </span>
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground">Unable to load profile.</p>
        )}
      </div>
      <DashboardFileUpload />
    </div>
  );
}
