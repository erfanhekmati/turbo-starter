import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { OtpPurpose, PrismaService, RegistrationStep, User } from '@repo/database';
import { AUTH_MODULE_OPTIONS } from '../auth.constants';
import type { AuthTokens } from '../types/auth-tokens.type';
import type { ResolvedAuthModuleOptions } from '../types/auth-module-options.type';
import { OtpService } from './otp.service';
import { PasswordHasherService } from './password-hasher.service';
import { TokenService } from './token.service';

@Injectable()
export class RegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly tokenService: TokenService,
    @Inject(AUTH_MODULE_OPTIONS) private readonly options: ResolvedAuthModuleOptions,
  ) {}

  async start(email: string): Promise<string> {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const sessionTtlMs = this.options.registration.sessionTtlMinutes * 60_000;
    const session = await this.prisma.registrationSession.upsert({
      where: { email },
      create: { email, expiresAt: new Date(Date.now() + sessionTtlMs) },
      update: {
        step: RegistrationStep.EMAIL_PENDING_VERIFICATION,
        expiresAt: new Date(Date.now() + sessionTtlMs),
      },
    });

    await this.otpService.requestOtp(email, OtpPurpose.REGISTRATION_EMAIL_VERIFICATION);

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

    return { tokens, user };
  }

  private async getActiveSession(registrationId: string) {
    const session = await this.prisma.registrationSession.findUnique({
      where: { id: registrationId },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired registration session');
    }

    return session;
  }
}
