import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@repo/database';
import { TooManyRequestsException } from '../../../common/exceptions';
import { EmailService } from '../../email/email.service';

@Injectable()
export class LoginLockoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async assertNotLocked(userId: string): Promise<void> {
    const lockout = await this.prisma.loginLockout.findUnique({
      where: { userId },
    });
    const now = new Date();

    if (lockout?.lockedUntil && lockout.lockedUntil > now) {
      throw new TooManyRequestsException(
        'Account temporarily locked due to too many failed attempts',
        Math.max(
          1,
          Math.ceil((lockout.lockedUntil.getTime() - now.getTime()) / 1000),
        ),
      );
    }
  }

  async recordFailure(userId: string): Promise<void> {
    const lockout = await this.prisma.loginLockout.findUnique({
      where: { userId },
    });
    const now = new Date();
    const wasLocked = Boolean(lockout?.lockedUntil && lockout.lockedUntil > now);
    const failedAttempts = (lockout?.failedAttempts ?? 0) + 1;
    const threshold = this.config.getOrThrow<number>(
      'auth.loginLockoutThreshold',
    );
    const lockoutMinutes = this.config.getOrThrow<number>(
      'auth.loginLockoutMinutes',
    );
    const lockedUntil =
      failedAttempts >= threshold
        ? new Date(Date.now() + lockoutMinutes * 60_000)
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
        await this.emailService.sendAccountLockedEmail(
          user.email,
          lockoutMinutes,
        );
      }
    }
  }

  async recordSuccess(userId: string): Promise<void> {
    await this.prisma.loginLockout.deleteMany({ where: { userId } });
  }
}
