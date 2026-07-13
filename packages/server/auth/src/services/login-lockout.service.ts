import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@repo/database';
import { AUTH_MODULE_OPTIONS } from '../auth.constants';
import { TooManyRequestsException } from '../exceptions/too-many-requests.exception';
import type { ResolvedAuthModuleOptions } from '../types/auth-module-options.type';

@Injectable()
export class LoginLockoutService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH_MODULE_OPTIONS) private readonly options: ResolvedAuthModuleOptions,
  ) {}

  async assertNotLocked(userId: string): Promise<void> {
    const lockout = await this.prisma.loginLockout.findUnique({ where: { userId } });
    const now = new Date();

    if (lockout?.lockedUntil && lockout.lockedUntil > now) {
      throw new TooManyRequestsException(
        'Account temporarily locked due to too many failed attempts',
        Math.max(1, Math.ceil((lockout.lockedUntil.getTime() - now.getTime()) / 1000)),
      );
    }
  }

  async recordFailure(userId: string): Promise<void> {
    const lockout = await this.prisma.loginLockout.findUnique({ where: { userId } });
    const failedAttempts = (lockout?.failedAttempts ?? 0) + 1;
    const lockedUntil =
      failedAttempts >= this.options.loginLockout.threshold
        ? new Date(Date.now() + this.options.loginLockout.lockoutMinutes * 60_000)
        : null;

    await this.prisma.loginLockout.upsert({
      where: { userId },
      create: { userId, failedAttempts, lockedUntil },
      update: { failedAttempts, lockedUntil },
    });
  }

  async recordSuccess(userId: string): Promise<void> {
    await this.prisma.loginLockout.deleteMany({ where: { userId } });
  }
}
