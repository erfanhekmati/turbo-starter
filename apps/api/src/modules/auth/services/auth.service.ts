import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { OtpPurpose, PrismaService, User } from '@repo/database';
import type { AuthTokens } from '../types';
import { LoginLockoutService } from './login-lockout.service';
import { OtpService } from './otp.service';
import { PasswordHasherService } from './password-hasher.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly otpService: OtpService,
    private readonly loginLockoutService: LoginLockoutService,
    private readonly tokenService: TokenService,
  ) {}

  async loginWithPassword(
    email: string,
    password: string,
  ): Promise<{ tokens: AuthTokens; user: User }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.loginLockoutService.assertNotLocked(user.id);

    const isValid = await this.passwordHasher.verify(
      user.passwordHash,
      password,
    );

    if (!isValid) {
      await this.loginLockoutService.recordFailure(user.id);
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.loginLockoutService.recordSuccess(user.id);
    const tokens = await this.tokenService.issueTokenPair(user.id, user.email);

    return { tokens, user };
  }

  async startOtpLogin(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return;
    }

    await this.otpService.requestOtp(email, OtpPurpose.LOGIN);
  }

  async verifyOtpLogin(
    email: string,
    code: string,
  ): Promise<{ tokens: AuthTokens; user: User }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException('Invalid or expired code');
    }

    await this.otpService.verifyOtp(email, OtpPurpose.LOGIN, code);
    const tokens = await this.tokenService.issueTokenPair(user.id, user.email);

    return { tokens, user };
  }
}
