import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpPurpose, PrismaService, RegistrationStep, User } from '@repo/database';
import type { AuthTokens } from '../types';
import { EmailService } from '../../email/email.service';
import { isExpired, sessionExpiresAt } from '../utils';
import { OtpService } from './otp.service';
import { PasswordHasherService } from './password-hasher.service';
import { TokenService } from './token.service';

@Injectable()
export class RegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly otpService: OtpService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
  ) {}

  async start(email: string): Promise<string> {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      // Opaque id — same response shape, no OTP sent (anti-enumeration)
      return randomUUID();
    }

    const ttlMinutes = this.config.getOrThrow<number>(
      'auth.registrationSessionTtlMinutes',
    );
    const session = await this.prisma.registrationSession.upsert({
      where: { email },
      create: { email, expiresAt: sessionExpiresAt(ttlMinutes) },
      update: {
        step: RegistrationStep.EMAIL_PENDING_VERIFICATION,
        expiresAt: sessionExpiresAt(ttlMinutes),
      },
    });

    await this.otpService.requestOtp(
      email,
      OtpPurpose.REGISTRATION_EMAIL_VERIFICATION,
    );

    return session.id;
  }

  async verifyEmail(registrationId: string, code: string): Promise<string> {
    const session = await this.getActiveSession(registrationId);

    await this.otpService.verifyOtp(
      session.email,
      OtpPurpose.REGISTRATION_EMAIL_VERIFICATION,
      code,
    );

    await this.prisma.registrationSession.update({
      where: { id: session.id },
      data: { step: RegistrationStep.EMAIL_VERIFIED },
    });

    return session.id;
  }

  async complete(
    registrationId: string,
    firstName: string,
    lastName: string,
    password: string,
  ): Promise<{ tokens: AuthTokens; user: User }> {
    const session = await this.getActiveSession(registrationId);

    if (session.step !== RegistrationStep.EMAIL_VERIFIED) {
      throw new BadRequestException('Email has not been verified yet');
    }

    const passwordHash = await this.passwordHasher.hash(password);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: session.email,
          firstName,
          lastName,
          passwordHash,
          emailVerifiedAt: new Date(),
        },
      });
      await tx.registrationSession.delete({ where: { id: session.id } });
      return createdUser;
    });

    const tokens = await this.tokenService.issueTokenPair(user.id, user.email);
    await this.emailService.sendWelcomeEmail(user.email, user.firstName);

    return { tokens, user };
  }

  private async getActiveSession(registrationId: string) {
    const session = await this.prisma.registrationSession.findUnique({
      where: { id: registrationId },
    });

    if (!session || isExpired(session.expiresAt)) {
      throw new BadRequestException('Invalid or expired registration session');
    }

    return session;
  }
}
