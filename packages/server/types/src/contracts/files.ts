import { z } from 'zod';

export const fileObjectSchema = z.object({
  id: z.string(),
  key: z.string(),
  bucket: z.string(),
  mimeType: z.string(),
  size: z.number(),
  originalName: z.string(),
  publicUrl: z.string().nullable().optional(),
  uploadedById: z.string(),
  createdAt: z.union([z.string(), z.date()]),
});

export const paginatedFilesSchema = z.object({
  items: z.array(fileObjectSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const presignUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(255),
  size: z.number().int().min(1).max(50 * 1024 * 1024),
});

export const presignUploadResponseSchema = z.object({
  uploadUrl: z.string().url(),
  key: z.string(),
  bucket: z.string(),
  publicUrl: z.string().optional(),
});

export const completeUploadSchema = z.object({
  key: z.string().min(1),
  mimeType: z.string().min(1).max(255),
  size: z.number().int().min(1).max(50 * 1024 * 1024),
  originalName: z.string().min(1).max(255),
});

export type FileObject = z.infer<typeof fileObjectSchema>;
export type PaginatedFiles = z.infer<typeof paginatedFilesSchema>;
export type PresignUploadInput = z.infer<typeof presignUploadSchema>;
export type PresignUploadResponse = z.infer<typeof presignUploadResponseSchema>;
export type CompleteUploadInput = z.infer<typeof completeUploadSchema>;
