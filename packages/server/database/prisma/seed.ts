import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import * as argon2 from 'argon2';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';

loadEnv({ path: path.resolve(__dirname, '../../../../.env') });

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required to run the database seed.`);
  }
  return value;
}

const connectionString = requireEnv('DATABASE_URL');
const ownerEmail = requireEnv('SEED_OWNER_EMAIL');
const ownerPassword = requireEnv('SEED_OWNER_PASSWORD');
const ownerFirstName = requireEnv('SEED_OWNER_FIRST_NAME');
const ownerLastName = requireEnv('SEED_OWNER_LAST_NAME');

const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

const ROLES = [
  { name: 'USER', description: 'Default application user' },
  { name: 'ADMIN', description: 'Full administrative access' },
] as const;

const PERMISSIONS = [
  { key: 'users:read', description: 'Read user profiles' },
  { key: 'users:write', description: 'Create and update users' },
  { key: 'roles:manage', description: 'Manage roles and permissions' },
  { key: 'audit:read', description: 'Read audit logs' },
  { key: 'files:read', description: 'Read uploaded files' },
  { key: 'files:write', description: 'Upload and delete files' },
] as const;

const USER_PERMISSION_KEYS = ['users:read', 'files:read', 'files:write'] as const;
const ADMIN_PERMISSION_KEYS = PERMISSIONS.map((permission) => permission.key);

async function seedOwnerUser(adminRoleId: string): Promise<void> {
  const passwordHash = await argon2.hash(ownerPassword, {
    type: argon2.argon2id,
  });

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    create: {
      email: ownerEmail,
      firstName: ownerFirstName,
      lastName: ownerLastName,
      passwordHash,
      emailVerifiedAt: new Date(),
      isActive: true,
    },
    update: {
      firstName: ownerFirstName,
      lastName: ownerLastName,
      passwordHash,
      emailVerifiedAt: new Date(),
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: owner.id,
        roleId: adminRoleId,
      },
    },
    create: {
      userId: owner.id,
      roleId: adminRoleId,
    },
    update: {},
  });
}

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

  await seedOwnerUser(adminRole.id);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
