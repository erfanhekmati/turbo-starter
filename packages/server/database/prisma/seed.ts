import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';
import { mysqlUrlToPoolConfig } from '../src/mysql-url.util';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required to run the database seed.');
}

const adapter = new PrismaMariaDb(mysqlUrlToPoolConfig(connectionString));
const prisma = new PrismaClient({ adapter });

const ROLES = [
  { name: 'USER', description: 'Default application user' },
  { name: 'ADMIN', description: 'Full administrative access' },
] as const;

const PERMISSIONS = [
  { key: 'users:read', description: 'Read user profiles' },
  { key: 'users:write', description: 'Create and update users' },
  { key: 'roles:manage', description: 'Manage roles and permissions' },
] as const;

const USER_PERMISSION_KEYS = ['users:read'] as const;
const ADMIN_PERMISSION_KEYS = PERMISSIONS.map((permission) => permission.key);

async function main(): Promise<void> {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      create: permission,
      update: { description: permission.description },
    });
  }

  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      create: role,
      update: { description: role.description },
    });
  }

  const permissionsByKey = await prisma.permission.findMany();
  const permissionIdByKey = new Map(
    permissionsByKey.map((permission) => [permission.key, permission.id]),
  );

  const userRole = await prisma.role.findUniqueOrThrow({
    where: { name: 'USER' },
  });
  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: 'ADMIN' },
  });

  await prisma.rolePermission.deleteMany({
    where: { roleId: { in: [userRole.id, adminRole.id] } },
  });

  await prisma.rolePermission.createMany({
    data: [
      ...USER_PERMISSION_KEYS.map((key) => ({
        roleId: userRole.id,
        permissionId: permissionIdByKey.get(key)!,
      })),
      ...ADMIN_PERMISSION_KEYS.map((key) => ({
        roleId: adminRole.id,
        permissionId: permissionIdByKey.get(key)!,
      })),
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await adapter.dispose();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    await adapter.dispose();
    process.exit(1);
  });
