import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService, User } from '@repo/database';
import { AuthService } from './auth.service';
import { LoginLockoutService } from './login-lockout.service';
import { OtpService } from './otp.service';
import { PasswordHasherService } from './password-hasher.service';
import { TokenService } from './token.service';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: { user: { findUnique: jest.Mock } };
  let passwordHasher: { verify: jest.Mock };
  let loginLockoutService: {
    assertNotLocked: jest.Mock;
    recordFailure: jest.Mock;
    recordSuccess: jest.Mock;
  };
  let tokenService: { issueTokenPair: jest.Mock };

  const user = {
    id: 'user-1',
    email: 'jane@example.com',
    passwordHash: 'hashed-password',
  } as User;

  beforeEach(async () => {
    prisma = { user: { findUnique: jest.fn() } };
    passwordHasher = { verify: jest.fn() };
    loginLockoutService = {
      assertNotLocked: jest.fn(),
      recordFailure: jest.fn(),
      recordSuccess: jest.fn(),
    };
    tokenService = { issueTokenPair: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: PasswordHasherService, useValue: passwordHasher },
        { provide: LoginLockoutService, useValue: loginLockoutService },
        { provide: TokenService, useValue: tokenService },
        { provide: OtpService, useValue: {} },
      ],
    }).compile();

    authService = module.get(AuthService);
  });

  describe('loginWithPassword', () => {
    it('throws UnauthorizedException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.loginWithPassword(user.email, 'password'),
      ).rejects.toThrow(UnauthorizedException);

      expect(loginLockoutService.assertNotLocked).not.toHaveBeenCalled();
    });

    it('records a failure and throws UnauthorizedException on a wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      passwordHasher.verify.mockResolvedValue(false);

      await expect(
        authService.loginWithPassword(user.email, 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);

      expect(loginLockoutService.recordFailure).toHaveBeenCalledWith(user.id);
      expect(tokenService.issueTokenPair).not.toHaveBeenCalled();
    });

    it('issues a token pair on a correct password', async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      passwordHasher.verify.mockResolvedValue(true);
      tokenService.issueTokenPair.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const result = await authService.loginWithPassword(
        user.email,
        'correct-password',
      );

      expect(loginLockoutService.recordSuccess).toHaveBeenCalledWith(user.id);
      expect(result.tokens).toEqual({
        accessToken: 'access',
        refreshToken: 'refresh',
      });
      expect(result.user).toEqual(user);
    });
  });
});
