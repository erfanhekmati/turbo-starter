'use client';

import { Skeleton, UserCardSkeleton } from '@repo/ui';
import { useCurrentUser } from '@/features/auth';

export default function DashboardPage() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading dashboard">
        <Skeleton className="h-8 w-40" />
        <UserCardSkeleton />
      </div>
    );
  }

  return (
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
  );
}
