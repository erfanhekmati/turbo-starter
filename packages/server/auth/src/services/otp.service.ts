import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { OtpPurpose, PrismaService } from '@repo/database';
import {
  AUTH_MODULE_OPTIONS,
  OTP_MAX_SENDS_PER_WINDOW,
  OTP_MAX_VERIFY_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_SEND_WINDOW_MINUTES,
  OTP_TTL_MINUTES,
} from '../auth.constants';
import { TooManyRequestsException } from '../exceptions/too-many-requests.exception';
import type { AuthModuleOptions } from '../types/auth-module-options.type';
import { hashOtp, verifyOtp as verifyOtpHash } from '../utils/hmac.util';
import { generateOtpCode } from '../utils/otp-code.util';
import { MailService } from '../mail/mail.service';

const SEND_WINDOW_MS = OTP_SEND_WINDOW_MINUTES * 60_000;
const RESEND_COOLDOWN_MS = OTP_RESEND_COOLDOWN_SECONDS * 1000;
const OTP_TTL_MS = OTP_TTL_MINUTES * 60_000;

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    @Inject(AUTH_MODULE_OPTIONS) private readonly options: AuthModuleOptions,
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

    const { windowStartAt, sentCount } = this.nextWindow(existing, now);

    if (sentCount > OTP_MAX_SENDS_PER_WINDOW) {
      const windowEndsAt = new Date(windowStartAt.getTime() + SEND_WINDOW_MS);
      throw new TooManyRequestsException(
        'Too many code requests, please try again later',
        this.secondsUntil(windowEndsAt, now),
      );
    }

    const code = generateOtpCode();
    const codeHash = hashOtp(code, this.options.otpSecret);
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);
    const resendAvailableAt = new Date(now.getTime() + RESEND_COOLDOWN_MS);

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

    await this.mailService.sendOtpEmail(email, code, purpose);
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

    const isValid = verifyOtpHash(code, challenge.codeHash, this.options.otpSecret);

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
  ): { windowStartAt: Date; sentCount: number } {
    if (existing && now.getTime() - existing.windowStartAt.getTime() < SEND_WINDOW_MS) {
      return { windowStartAt: existing.windowStartAt, sentCount: existing.sentCount + 1 };
    }
    return { windowStartAt: now, sentCount: 1 };
  }

  private secondsUntil(target: Date, from: Date): number {
    return Math.max(1, Math.ceil((target.getTime() - from.getTime()) / 1000));
  }
}
