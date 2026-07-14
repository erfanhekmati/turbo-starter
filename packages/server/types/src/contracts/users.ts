import { z } from 'zod';
import { ALL_ROLE_NAMES } from '../rbac';
import { userSchema } from './auth';

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  roleNames: z.array(z.enum(ALL_ROLE_NAMES as [string, ...string[]])).optional(),
});

export const paginatedUsersSchema = z.object({
  items: z.array(userSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const auditLogActorSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
  })
  .nullable();

export const auditLogSchema = z.object({
  id: z.string(),
  actorUserId: z.string().nullable(),
  actor: auditLogActorSchema.optional(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().nullable(),
  metadata: z.unknown().nullable().optional(),
  ip: z.string().nullable().optional(),
  createdAt: z.union([z.string(), z.date()]),
});

export const paginatedAuditLogsSchema = z.object({
  items: z.array(auditLogSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type PaginatedUsers = z.infer<typeof paginatedUsersSchema>;
export type AuditLog = z.infer<typeof auditLogSchema>;
export type PaginatedAuditLogs = z.infer<typeof paginatedAuditLogsSchema>;
