'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardCard, StatisticsCard } from '@repo/ui';
import { FileText, Shield, Users } from 'lucide-react';
import { useCurrentUser } from '@/features/auth';
import { getApiClient } from '@/lib/api';

export default function DashboardPage() {
  const { data: currentUser } = useCurrentUser();
  const { data: users } = useQuery({
    queryKey: ['admin', 'users', 'stats'],
    queryFn: () => getApiClient().users.list({ page: 1, pageSize: 1 }),
  });
  const { data: audit } = useQuery({
    queryKey: ['admin', 'audit', 'stats'],
    queryFn: () => getApiClient().audit.list({ page: 1, pageSize: 5 }),
  });
  const { data: files } = useQuery({
    queryKey: ['admin', 'files', 'stats'],
    queryFn: () => getApiClient().files.list({ page: 1, pageSize: 5 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your users, files, and audit trail.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatisticsCard
          label="Users"
          value={users?.total ?? 0}
          icon={<Users className="size-4" />}
        />
        <StatisticsCard
          label="Audit events"
          value={audit?.total ?? 0}
          icon={<Shield className="size-4" />}
        />
        <StatisticsCard
          label="Files"
          value={files?.total ?? 0}
          icon={<FileText className="size-4" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardCard
          title="Signed-in admin"
          description="Current session profile"
        >
          {currentUser ? (
            <div className="space-y-2 text-sm">
              <p>
                <strong>Name:</strong> {currentUser.firstName}{' '}
                {currentUser.lastName}
              </p>
              <p>
                <strong>Email:</strong> {currentUser.email}
              </p>
              <p>
                <strong>Roles:</strong> {currentUser.roles.join(', ') || 'None'}
              </p>
              <p>
                <strong>TOTP:</strong>{' '}
                {currentUser.totpEnabled ? 'Enabled' : 'Not enabled'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading profile...</p>
          )}
        </DashboardCard>

        <DashboardCard
          title="Recent audit events"
          description="Latest actions recorded by the API"
        >
          <div className="space-y-3">
            {audit?.items.length ? (
              audit.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border p-3 text-sm leading-6"
                >
                  <div className="font-medium">{item.action}</div>
                  <div className="text-muted-foreground">
                    {item.entityType}
                    {item.entityId ? ` · ${item.entityId}` : ''}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No audit events found.
              </p>
            )}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
