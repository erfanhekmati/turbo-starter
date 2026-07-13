import { BadRequestException, Injectable } from '@nestjs/common';
import { OtpPurpose, PasswordResetStep, PrismaService } from '@repo/database';
import { PASSWORD_RESET_SESSION_TTL_MINUTES } from '../auth.constants';
import { OtpService } from './otp.service';
import { PasswordHasherService } from './password-hasher.service';
import { TokenService } from './token.service';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly tokenService: TokenService,
  ) {}

  async start(email: string): Promise<string> {
    const sessionTtlMs = PASSWORD_RESET_SESSION_TTL_MINUTES * 60_000;
    const session = await this.prisma.passwordResetSession.upsert({
      where: { email },
      create: { email, expiresAt: new Date(Date.now() + sessionTtlMs) },
      update: {
        step: PasswordResetStep.PENDING_VERIFICATION,
        expiresAt: new Date(Date.now() + sessionTtlMs),
      },
    });

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      await this.otpService.requestOtp(email, OtpPurpose.PASSWORD_RESET);
    }

    return session.id;
  }

  async verifyOtp(resetId: string, code: string): Promise<string> {
    const session = await this.getActiveSession(resetId);

    await this.otpService.verifyOtp(session.email, OtpPurpose.PASSWORD_RESET, code);

    await this.prisma.passwordResetSession.update({
      where: { id: session.id },
      data: { step: PasswordResetStep.VERIFIED },
    });

    return session.id;
  }

  async confirm(resetId: string, password: string): Promise<void> {
    const session = await this.getActiveSession(resetId);

    if (session.step !== PasswordResetStep.VERIFIED) {
      throw new BadRequestException('Code has not been verified yet');
    }

    const user = await this.prisma.user.findUnique({ where: { email: session.email } });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset session');
    }

    const passwordHash = await this.passwordHasher.hash(password);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
      await tx.passwordResetSession.delete({ where: { id: session.id } });
    });

    await this.tokenService.revokeAllForUser(user.id);
  }

  private async getActiveSession(resetId: string) {
    const session = await this.prisma.passwordResetSession.findUnique({
      where: { id: resetId },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset session');
    }

    return session;
  }
}
