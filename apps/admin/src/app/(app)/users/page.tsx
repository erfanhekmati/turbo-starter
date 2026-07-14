'use client';

import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import type { User } from '@repo/backend-types';
import { Button, DataTable, toast } from '@repo/ui';
import { ApiError } from '@repo/api-client';
import { getApiClient } from '@/lib/api';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => getApiClient().users.list({ page: 1, pageSize: 100 }),
  });

  async function deactivateUser(user: User) {
    try {
      await getApiClient().users.deactivate(user.id);
      toast.success(`Deactivated ${user.email}`);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to deactivate user',
      );
    }
  }

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'email',
        header: 'Email',
      },
      {
        id: 'name',
        header: 'Name',
        cell: ({ row }) =>
          `${row.original.firstName} ${row.original.lastName}`.trim(),
      },
      {
        accessorKey: 'roles',
        header: 'Roles',
        cell: ({ row }) => row.original.roles.join(', ') || 'None',
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (row.original.isActive ? 'Active' : 'Inactive'),
      },
      {
        accessorKey: 'totpEnabled',
        header: '2FA',
        cell: ({ row }) => (row.original.totpEnabled ? 'Enabled' : 'Off'),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!row.original.isActive}
            onClick={() => void deactivateUser(row.original)}
          >
            Deactivate
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Review user accounts and deactivate access when needed.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        searchPlaceholder="Search users..."
        exportFilename="users.csv"
      />
    </div>
  );
}
