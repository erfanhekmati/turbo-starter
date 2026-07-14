'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import type { AuditLog } from '@repo/backend-types';
import { DataTable } from '@repo/ui';
import { getApiClient } from '@/lib/api';

export default function AuditPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit'],
    queryFn: () => getApiClient().audit.list({ page: 1, pageSize: 100 }),
  });

  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        accessorKey: 'action',
        header: 'Action',
      },
      {
        accessorKey: 'entityType',
        header: 'Entity',
      },
      {
        accessorKey: 'entityId',
        header: 'Entity ID',
        cell: ({ row }) => row.original.entityId ?? 'N/A',
      },
      {
        id: 'actor',
        header: 'Actor',
        cell: ({ row }) => row.original.actor?.email ?? 'System',
      },
      {
        accessorKey: 'ip',
        header: 'IP',
        cell: ({ row }) => row.original.ip ?? 'N/A',
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleString(),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit</h1>
        <p className="text-sm text-muted-foreground">
          Inspect the recorded administrative and user-facing activity.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        searchPlaceholder="Search audit logs..."
        exportFilename="audit-logs.csv"
      />
    </div>
  );
}
