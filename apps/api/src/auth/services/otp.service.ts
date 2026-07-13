import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  generateOtpCode,
  hashOtp,
  TooManyRequestsException,
  verifyOtp as verifyOtpHash,
} from '@repo/auth';
import { OtpPurpose, PrismaService } from '@repo/database';
import { EmailService } from '../../email/email.service';
import {
  OTP_LENGTH,
  OTP_MAX_SENDS_PER_WINDOW,
  OTP_MAX_VERIFY_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_SEND_WINDOW_MINUTES,
  OTP_TTL_MINUTES,
} from '../auth.constants';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
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

    const sendWindowMs = OTP_SEND_WINDOW_MINUTES * 60_000;
    const { windowStartAt, sentCount } = this.nextWindow(existing, now, sendWindowMs);

    if (sentCount > OTP_MAX_SENDS_PER_WINDOW) {
      const windowEndsAt = new Date(windowStartAt.getTime() + sendWindowMs);
      throw new TooManyRequestsException(
        'Too many code requests, please try again later',
        this.secondsUntil(windowEndsAt, now),
      );
    }

    const otpSecret = this.config.getOrThrow<string>('otp.hashSecret');
    const code = generateOtpCode(OTP_LENGTH);
    const codeHash = hashOtp(code, otpSecret);
    const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60_000);
    const resendAvailableAt = new Date(now.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000);

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

    await this.emailService.sendOtpEmail(email, code, purpose);
  }

  async verifyOtp(email: string, purpose: OtpPurpose, code: string): Promise<void> {
    const challenge = await this.prisma.otpChallenge.findUnique({
      where: { email_purpose: { email, purpose } },
    });

    if (!challenge) {
      throw new BadRequestException('Invalid or expired code');
    }

    const now = new Date();

    if (challenge.expiresAt < now || challenge.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
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
