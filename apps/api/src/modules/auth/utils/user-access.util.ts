import type { Prisma } from '@repo/database';

export const userAccessSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  emailVerifiedAt: true,
  createdAt: true,
  isActive: true,
  totpEnabledAt: true,
  roles: {
    select: {
      role: {
        select: {
          name: true,
          permissions: {
            select: {
              permission: {
                select: { key: true },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

export type UserWithAccessRelations = Prisma.UserGetPayload<{
  select: typeof userAccessSelect;
}>;

export type UserProfile = Omit<
  UserWithAccessRelations,
  'roles' | 'totpEnabledAt'
> & {
  roles: string[];
  permissions: string[];
  totpEnabled: boolean;
};

export function flattenUserAccess(
  user: UserWithAccessRelations,
): UserProfile {
  const roles = [...new Set(user.roles.map((userRole) => userRole.role.name))];
  const permissions = [
    ...new Set(
      user.roles.flatMap((userRole) =>
        userRole.role.permissions.map(
          (rolePermission) => rolePermission.permission.key,
        ),
      ),
    ),
  ];

  const { roles: _roles, totpEnabledAt, ...profile } = user;

  return {
    ...profile,
    roles,
    permissions,
    totpEnabled: Boolean(totpEnabledAt),
  };
}
