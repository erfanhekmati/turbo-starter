import {
  paginatedAuditLogsSchema,
  type PaginatedAuditLogs,
} from '@repo/backend-types';
import type { HttpTransport } from '../types';

export type ListAuditLogsParams = {
  page?: number;
  pageSize?: number;
  entityType?: string;
};

export type AuditResource = {
  list(params?: ListAuditLogsParams): Promise<PaginatedAuditLogs>;
};

export function createAuditResource(http: HttpTransport): AuditResource {
  const { request } = http;

  return {
    list(params) {
      return request(
        '/audit-logs',
        { method: 'GET', params },
        paginatedAuditLogsSchema,
      );
    },
  };
}
