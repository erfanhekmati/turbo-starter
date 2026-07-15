import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoleName } from '@repo/backend-types';
import { OtpPurpose, PrismaService, RegistrationStep } from '@repo/database';
import type { AuthTokens } from '../types';
import { MailQueueService } from '../../queue/mail-queue.service';
import { isExpired, sessionExpiresAt } from '../utils';
import {
  flattenUserAccess,
  userAccessSelect,
  type UserProfile,
} from '../utils/user-access.util';
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
    private readonly mailQueue: MailQueueService,
  ) {}

  async start(email: string): Promise<string> {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
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
  ): Promise<{ tokens: AuthTokens; user: UserProfile }> {
    const session = await this.getActiveSession(registrationId);

    if (session.step !== RegistrationStep.EMAIL_VERIFIED) {
      throw new BadRequestException('Email has not been verified yet');
    }

    const passwordHash = await this.passwordHasher.hash(password);

    const userId = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: session.email,
          firstName,
          lastName,
          passwordHash,
          emailVerifiedAt: new Date(),
        },
      });

      const defaultRole = await tx.role.findUnique({
        where: { name: RoleName.USER },
      });

      if (!defaultRole) {
        throw new InternalServerErrorException('Default role not configured');
      }

      await tx.userRole.create({
        data: {
          userId: createdUser.id,
          roleId: defaultRole.id,
        },
      });

      await tx.registrationSession.delete({ where: { id: session.id } });
      return createdUser.id;
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: userAccessSelect,
    });
    const profile = flattenUserAccess(user);
    const tokens = await this.tokenService.issueTokenPair(profile.id, profile.email);
    await this.mailQueue.enqueueWelcome(profile.email, profile.firstName);

    return { tokens, user: profile };
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
