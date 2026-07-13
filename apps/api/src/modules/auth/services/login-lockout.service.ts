import { Injectable } from '@nestjs/common';
import { TooManyRequestsException } from '@repo/auth';
import { PrismaService } from '@repo/database';
import { EmailService } from '../../../email/email.service';
import { LOGIN_LOCKOUT_MINUTES, LOGIN_LOCKOUT_THRESHOLD } from '../auth.constants';

@Injectable()
export class LoginLockoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
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
    const now = new Date();
    const wasLocked = Boolean(lockout?.lockedUntil && lockout.lockedUntil > now);
    const failedAttempts = (lockout?.failedAttempts ?? 0) + 1;
    const lockedUntil =
      failedAttempts >= LOGIN_LOCKOUT_THRESHOLD
        ? new Date(Date.now() + LOGIN_LOCKOUT_MINUTES * 60_000)
        : null;

    await this.prisma.loginLockout.upsert({
      where: { userId },
      create: { userId, failedAttempts, lockedUntil },
      update: { failedAttempts, lockedUntil },
    });

    if (lockedUntil && !wasLocked) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (user) {
        await this.emailService.sendAccountLockedEmail(user.email, LOGIN_LOCKOUT_MINUTES);
      }
    }
  }

  async recordSuccess(userId: string): Promise<void> {
    await this.prisma.loginLockout.deleteMany({ where: { userId } });
  }
}
