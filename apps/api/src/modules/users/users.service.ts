import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PermissionKey } from '@repo/backend-types';
import { Prisma, PrismaService } from '@repo/database';
import { AuditService } from '../audit/audit.service';
import {
  flattenUserAccess,
  userAccessSelect,
} from '../auth/utils/user-access.util';
import type { AuthenticatedUser } from '../auth/types';
import type { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(params: {
    page: number;
    pageSize: number;
    search?: string;
  }) {
    const where: Prisma.UserWhereInput = params.search
      ? {
          OR: [
            { email: { contains: params.search } },
            { firstName: { contains: params.search } },
            { lastName: { contains: params.search } },
          ],
        }
      : {};

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        select: userAccessSelect,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map((user) => flattenUserAccess(user)),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userAccessSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return flattenUserAccess(user);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    actor: AuthenticatedUser,
    ip?: string,
  ) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    if (dto.roleNames !== undefined) {
      if (!actor.permissions.includes(PermissionKey.ROLES_MANAGE)) {
        throw new ForbiddenException(
          'roles:manage permission is required to change roles',
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
          ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      if (dto.roleNames !== undefined) {
        const roles = await tx.role.findMany({
          where: { name: { in: dto.roleNames } },
        });

        if (roles.length !== dto.roleNames.length) {
          throw new NotFoundException('One or more roles were not found');
        }

        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.createMany({
          data: roles.map((role) => ({ userId: id, roleId: role.id })),
        });
      }
    });

    await this.auditService.log({
      actorUserId: actor.id,
      action: 'user.update',
      entityType: 'User',
      entityId: id,
      metadata: dto as unknown as Prisma.InputJsonValue,
      ip,
    });

    return this.getById(id);
  }

  async deactivate(id: string, actor: AuthenticatedUser, ip?: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    if (id === actor.id) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await this.auditService.log({
      actorUserId: actor.id,
      action: 'user.deactivate',
      entityType: 'User',
      entityId: id,
      ip,
    });

    return this.getById(id);
  }
}
