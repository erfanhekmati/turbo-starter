export const RoleName = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export type RoleName = (typeof RoleName)[keyof typeof RoleName];

export const PermissionKey = {
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  ROLES_MANAGE: 'roles:manage',
} as const;

export type PermissionKey =
  (typeof PermissionKey)[keyof typeof PermissionKey];

export const ALL_ROLE_NAMES = Object.values(RoleName);
export const ALL_PERMISSION_KEYS = Object.values(PermissionKey);
