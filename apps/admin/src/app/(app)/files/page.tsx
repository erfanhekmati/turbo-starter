'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import type { FileObject } from '@repo/backend-types';
import { ApiError } from '@repo/api-client';
import { Button, DataTable, FileUpload, toast } from '@repo/ui';
import { getApiClient } from '@/lib/api';

export default function FilesPage() {
  const queryClient = useQueryClient();
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'files'],
    queryFn: () => getApiClient().files.list({ page: 1, pageSize: 100 }),
  });

  async function uploadSelectedFiles() {
    if (filesToUpload.length === 0) {
      toast.error('Select at least one file first');
      return;
    }

    setIsUploading(true);

    try {
      for (const file of filesToUpload) {
        const presigned = await getApiClient().files.presignUpload({
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
        });

        const uploadResponse = await fetch(presigned.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        await getApiClient().files.completeUpload({
          key: presigned.key,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          originalName: file.name,
        });
      }

      toast.success('Files uploaded successfully');
      setFilesToUpload([]);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'files'] });
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to upload files',
      );
    } finally {
      setIsUploading(false);
    }
  }

  const columns = useMemo<ColumnDef<FileObject>[]>(
    () => [
      {
        accessorKey: 'originalName',
        header: 'Name',
      },
      {
        accessorKey: 'mimeType',
        header: 'Type',
      },
      {
        accessorKey: 'size',
        header: 'Size',
        cell: ({ row }) => `${Math.ceil(row.original.size / 1024)} KB`,
      },
      {
        accessorKey: 'uploadedById',
        header: 'Uploader',
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleString(),
      },
      {
        id: 'link',
        header: 'Public URL',
        cell: ({ row }) =>
          row.original.publicUrl ? (
            <a
              href={row.original.publicUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              Open
            </a>
          ) : (
            'N/A'
          ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Files</h1>
        <p className="text-sm text-muted-foreground">
          Upload assets through the API presign flow and review stored metadata.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <FileUpload
          value={filesToUpload}
          onValueChange={setFilesToUpload}
          multiple
        />
        <Button onClick={() => void uploadSelectedFiles()} loading={isUploading}>
          Upload selected files
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading files...</p>
      ) : (
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          searchPlaceholder="Search files..."
          exportFilename="files.csv"
        />
      )}
    </div>
  );
}
