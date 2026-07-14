'use client';

import { useState } from 'react';
import { FileUpload, toast } from '@repo/ui';
import { ApiError } from '@repo/api-client';
import { getApiClient } from '@/lib/api';

export function DashboardFileUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  async function uploadSelected(next: File[]) {
    setFiles(next);
    if (next.length === 0) return;

    setUploading(true);
    try {
      const client = getApiClient();
      for (const file of next) {
        const presign = await client.files.presignUpload({
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
        });

        const putResponse = await fetch(presign.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        });

        if (!putResponse.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        await client.files.completeUpload({
          key: presign.key,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          originalName: file.name,
        });
      }
      toast.success('Upload complete');
      setFiles([]);
    } catch (error) {
      toast.error(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Upload failed',
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-medium">Upload files</h2>
      <FileUpload
        value={files}
        onValueChange={uploadSelected}
        disabled={uploading}
        maxFiles={5}
      />
    </div>
  );
}
