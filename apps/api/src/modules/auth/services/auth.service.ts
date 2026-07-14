import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RoleName } from '@repo/backend-types';
import { OtpPurpose, PrismaService } from '@repo/database';
import type { AuthTokens } from '../types';
import {
  flattenUserAccess,
  userAccessSelect,
  type UserProfile,
} from '../utils/user-access.util';
import { LoginLockoutService } from './login-lockout.service';
import { OtpService } from './otp.service';
import { PasswordHasherService } from './password-hasher.service';
import { TotpService } from './totp.service';
import { TokenService } from './token.service';

type PasswordLoginResult =
  | { requires2fa: true; mfaToken: string }
  | { requires2fa: false; tokens: AuthTokens; user: UserProfile };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly otpService: OtpService,
    private readonly totpService: TotpService,
    private readonly loginLockoutService: LoginLockoutService,
    private readonly tokenService: TokenService,
  ) {}

  async loginWithPassword(
    email: string,
    password: string,
  ): Promise<PasswordLoginResult> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        isActive: true,
        totpEnabledAt: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.loginLockoutService.assertNotLocked(user.id);

    if (!user.isActive || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await this.passwordHasher.verify(
      user.passwordHash,
      password,
    );

    if (!isValid) {
      await this.loginLockoutService.recordFailure(user.id);
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.loginLockoutService.recordSuccess(user.id);

    const roles = user.roles.map((userRole) => userRole.role.name);
    const requires2fa =
      roles.includes(RoleName.ADMIN) && Boolean(user.totpEnabledAt);

    if (requires2fa) {
      const mfaToken = await this.tokenService.issueMfaToken(user.id, user.email);
      return { requires2fa: true, mfaToken };
    }

    const tokens = await this.tokenService.issueTokenPair(user.id, user.email);
    const profile = await this.getProfile(user.id);

    return { requires2fa: false, tokens, user: profile };
  }

  async startOtpLogin(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return;
    }

    try {
      await this.loginLockoutService.assertNotLocked(user.id);
    } catch {
      // Same silent response as unknown emails (anti-enumeration)
      return;
    }

    await this.otpService.requestOtp(email, OtpPurpose.LOGIN);
  }

  async verifyOtpLogin(
    email: string,
    code: string,
  ): Promise<{ tokens: AuthTokens; user: UserProfile }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired code');
    }

    await this.loginLockoutService.assertNotLocked(user.id);
    await this.otpService.verifyOtp(email, OtpPurpose.LOGIN, code);
    await this.loginLockoutService.recordSuccess(user.id);

    const tokens = await this.tokenService.issueTokenPair(user.id, user.email);
    const profile = await this.getProfile(user.id);

    return { tokens, user: profile };
  }

  async loginWith2fa(
    mfaToken: string,
    code: string,
  ): Promise<{ tokens: AuthTokens; user: UserProfile }> {
    const payload = await this.tokenService.verifyMfaToken(mfaToken);
    await this.totpService.verifyForLogin(payload.sub, code);

    const tokens = await this.tokenService.issueTokenPair(
      payload.sub,
      payload.email,
    );
    const profile = await this.getProfile(payload.sub);

    return { tokens, user: profile };
  }

  async loginWithOAuth(input: {
    provider: 'google' | 'github';
    providerAccountId: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<{ tokens: AuthTokens; user: UserProfile }> {
    const role = await this.prisma.role.findUnique({
      where: { name: RoleName.USER },
      select: { id: true },
    });

    if (!role) {
      throw new NotFoundException('Default user role is not configured');
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const existingAccount = await tx.oAuthAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: input.provider,
            providerAccountId: input.providerAccountId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              isActive: true,
            },
          },
        },
      });

      if (existingAccount) {
        if (!existingAccount.user.isActive) {
          throw new UnauthorizedException('Account is inactive');
        }

        await tx.userRole.upsert({
          where: {
            userId_roleId: {
              userId: existingAccount.userId,
              roleId: role.id,
            },
          },
          update: {},
          create: {
            userId: existingAccount.userId,
            roleId: role.id,
          },
        });

        return existingAccount.user;
      }

      const existingUser = await tx.user.findUnique({
        where: { email: input.email },
        select: {
          id: true,
          email: true,
          isActive: true,
        },
      });

      if (existingUser && !existingUser.isActive) {
        throw new UnauthorizedException('Account is inactive');
      }

      const linkedUser =
        existingUser ??
        (await tx.user.create({
          data: {
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            emailVerifiedAt: new Date(),
          },
          select: {
            id: true,
            email: true,
            isActive: true,
          },
        }));

      await tx.oAuthAccount.create({
        data: {
          provider: input.provider,
          providerAccountId: input.providerAccountId,
          userId: linkedUser.id,
        },
      });

      await tx.userRole.upsert({
        where: {
          userId_roleId: {
            userId: linkedUser.id,
            roleId: role.id,
          },
        },
        update: {},
        create: {
          userId: linkedUser.id,
          roleId: role.id,
        },
      });

      return linkedUser;
    });

    const tokens = await this.tokenService.issueTokenPair(user.id, user.email);
    const profile = await this.getProfile(user.id);

    return { tokens, user: profile };
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: userAccessSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return flattenUserAccess(user);
  }
}
