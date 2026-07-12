import { Injectable } from '@nestjs/common';
import { PrismaService } from '@repo/database';
import { LOGIN_LOCKOUT_MINUTES, LOGIN_LOCKOUT_THRESHOLD } from '../auth.constants';
import { TooManyRequestsException } from '../exceptions/too-many-requests.exception';

const LOCKOUT_DURATION_MS = LOGIN_LOCKOUT_MINUTES * 60_000;

@Injectable()
export class LoginLockoutService {
  constructor(private readonly prisma: PrismaService) {}

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
      failedAttempts >= LOGIN_LOCKOUT_THRESHOLD
        ? new Date(Date.now() + LOCKOUT_DURATION_MS)
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
