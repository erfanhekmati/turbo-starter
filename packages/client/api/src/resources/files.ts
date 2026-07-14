import {
  completeUploadSchema,
  fileObjectSchema,
  paginatedFilesSchema,
  presignUploadResponseSchema,
  presignUploadSchema,
  type CompleteUploadInput,
  type FileObject,
  type PaginatedFiles,
  type PresignUploadInput,
  type PresignUploadResponse,
} from '@repo/backend-types';
import type { HttpTransport } from '../types';

export type ListFilesParams = {
  page?: number;
  pageSize?: number;
};

export type FilesResource = {
  list(params?: ListFilesParams): Promise<PaginatedFiles>;
  getById(id: string): Promise<FileObject>;
  presignUpload(input: PresignUploadInput): Promise<PresignUploadResponse>;
  completeUpload(input: CompleteUploadInput): Promise<FileObject>;
};

export function createFilesResource(http: HttpTransport): FilesResource {
  const { request } = http;

  return {
    list(params) {
      return request(
        '/files',
        { method: 'GET', params },
        paginatedFilesSchema,
      );
    },

    getById(id) {
      return request(`/files/${id}`, { method: 'GET' }, fileObjectSchema);
    },

    presignUpload(input) {
      return request(
        '/files/presign',
        { method: 'POST', data: presignUploadSchema.parse(input) },
        presignUploadResponseSchema,
      );
    },

    completeUpload(input) {
      return request(
        '/files/complete',
        { method: 'POST', data: completeUploadSchema.parse(input) },
        fileObjectSchema,
      );
    },
  };
}
