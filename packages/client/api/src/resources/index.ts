import type { HttpTransport } from '../types';
import { createAuthResource } from './auth';
import { createAuditResource } from './audit';
import { createFilesResource } from './files';
import { createUsersResource } from './users';

export { createAuthResource, type AuthResource } from './auth';
export {
  createAuditResource,
  type AuditResource,
  type ListAuditLogsParams,
} from './audit';
export {
  createFilesResource,
  type FilesResource,
  type ListFilesParams,
} from './files';
export {
  createUsersResource,
  type UsersResource,
  type ListUsersParams,
} from './users';

export function createResources(http: HttpTransport) {
  return {
    auth: createAuthResource(http),
    users: createUsersResource(http),
    audit: createAuditResource(http),
    files: createFilesResource(http),
  };
}
