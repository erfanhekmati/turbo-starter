import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateOtpCode, hashOtp, verifyOtp as verifyOtpHash } from '@repo/backend-utils';
import { OtpPurpose, PrismaService } from '@repo/database';
import { TooManyRequestsException } from '../../../common/exceptions';
import { MailQueueService } from '../../queue/mail-queue.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mailQueue: MailQueueService,
  ) {}

  async requestOtp(email: string, purpose: OtpPurpose): Promise<void> {
    const now = new Date();
    const existing = await this.prisma.otpChallenge.findUnique({
      where: { email_purpose: { email, purpose } },
    });

    if (existing && existing.resendAvailableAt > now) {
      throw new TooManyRequestsException(
        'Please wait before requesting another code',
        this.secondsUntil(existing.resendAvailableAt, now),
      );
    }

    const sendWindowMs =
      this.config.getOrThrow<number>('otp.sendWindowMinutes') * 60_000;
    const maxSends = this.config.getOrThrow<number>('otp.maxSendsPerWindow');
    const { windowStartAt, sentCount } = this.nextWindow(
      existing,
      now,
      sendWindowMs,
    );

    if (sentCount > maxSends) {
      const windowEndsAt = new Date(windowStartAt.getTime() + sendWindowMs);
      throw new TooManyRequestsException(
        'Too many code requests, please try again later',
        this.secondsUntil(windowEndsAt, now),
      );
    }

    const otpSecret = this.config.getOrThrow<string>('otp.hashSecret');
    const code = generateOtpCode(this.config.getOrThrow<number>('otp.length'));
    const codeHash = hashOtp(code, otpSecret);
    const expiresAt = new Date(
      now.getTime() + this.config.getOrThrow<number>('otp.ttlMinutes') * 60_000,
    );
    const resendAvailableAt = new Date(
      now.getTime() +
        this.config.getOrThrow<number>('otp.resendCooldownSeconds') * 1000,
    );

    await this.prisma.otpChallenge.upsert({
      where: { email_purpose: { email, purpose } },
      create: {
        email,
        purpose,
        codeHash,
        sentCount,
        windowStartAt,
        resendAvailableAt,
        expiresAt,
      },
      update: {
        codeHash,
        sentCount,
        windowStartAt,
        resendAvailableAt,
        expiresAt,
        attempts: 0,
      },
    });

    try {
      await this.mailQueue.enqueueOtp(email, code, purpose);
    } catch (error) {
      await this.prisma.otpChallenge.delete({
        where: { email_purpose: { email, purpose } },
      });
      this.logger.error(
        `Failed to enqueue OTP email to ${email} for ${purpose}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async verifyOtp(email: string, purpose: OtpPurpose, code: string): Promise<void> {
    const challenge = await this.prisma.otpChallenge.findUnique({
      where: { email_purpose: { email, purpose } },
    });

    if (!challenge) {
      throw new BadRequestException('Invalid or expired code');
    }

    const now = new Date();
    const maxAttempts = this.config.getOrThrow<number>('otp.maxVerifyAttempts');

    if (challenge.expiresAt < now || challenge.attempts >= maxAttempts) {
      await this.prisma.otpChallenge.delete({ where: { id: challenge.id } });
      throw new BadRequestException('Invalid or expired code');
    }

    const otpSecret = this.config.getOrThrow<string>('otp.hashSecret');
    const isValid = verifyOtpHash(code, challenge.codeHash, otpSecret);

    if (!isValid) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid or expired code');
    }

    await this.prisma.otpChallenge.delete({ where: { id: challenge.id } });
  }

  private nextWindow(
    existing: { windowStartAt: Date; sentCount: number } | null,
    now: Date,
    sendWindowMs: number,
  ): { windowStartAt: Date; sentCount: number } {
    if (existing && now.getTime() - existing.windowStartAt.getTime() < sendWindowMs) {
      return { windowStartAt: existing.windowStartAt, sentCount: existing.sentCount + 1 };
    }
    return { windowStartAt: now, sentCount: 1 };
  }

  private secondsUntil(target: Date, from: Date): number {
    return Math.max(1, Math.ceil((target.getTime() - from.getTime()) / 1000));
  }
}
