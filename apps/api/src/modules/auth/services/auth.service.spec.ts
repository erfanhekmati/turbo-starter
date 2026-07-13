import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { OtpPurpose, PrismaService } from '@repo/database';
import { RoleName } from '@repo/backend-types';
import { TooManyRequestsException } from '../../../common/exceptions';
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
  let otpService: { requestOtp: jest.Mock; verifyOtp: jest.Mock };
  let tokenService: { issueTokenPair: jest.Mock };

  const profile = {
    id: 'user-1',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    roles: [RoleName.USER],
    permissions: ['users:read'],
  };

  const userWithPassword = {
    id: profile.id,
    email: profile.email,
    passwordHash: 'hashed-password',
  };

  const userWithAccess = {
    ...profile,
    roles: [
      {
        role: {
          name: RoleName.USER,
          permissions: [{ permission: { key: 'users:read' } }],
        },
      },
    ],
  };

  beforeEach(async () => {
    prisma = { user: { findUnique: jest.fn() } };
    passwordHasher = { verify: jest.fn() };
    loginLockoutService = {
      assertNotLocked: jest.fn(),
      recordFailure: jest.fn(),
      recordSuccess: jest.fn(),
    };
    otpService = { requestOtp: jest.fn(), verifyOtp: jest.fn() };
    tokenService = { issueTokenPair: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: PasswordHasherService, useValue: passwordHasher },
        { provide: LoginLockoutService, useValue: loginLockoutService },
        { provide: TokenService, useValue: tokenService },
        { provide: OtpService, useValue: otpService },
      ],
    }).compile();

    authService = module.get(AuthService);
  });

  describe('loginWithPassword', () => {
    it('throws UnauthorizedException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.loginWithPassword(profile.email, 'password'),
      ).rejects.toThrow(UnauthorizedException);

      expect(loginLockoutService.assertNotLocked).not.toHaveBeenCalled();
    });

    it('records a failure and throws UnauthorizedException on a wrong password', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(userWithPassword)
        .mockResolvedValueOnce(userWithAccess);
      passwordHasher.verify.mockResolvedValue(false);

      await expect(
        authService.loginWithPassword(profile.email, 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);

      expect(loginLockoutService.recordFailure).toHaveBeenCalledWith(profile.id);
      expect(tokenService.issueTokenPair).not.toHaveBeenCalled();
    });

    it('issues a token pair on a correct password', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(userWithPassword)
        .mockResolvedValueOnce(userWithAccess);
      passwordHasher.verify.mockResolvedValue(true);
      tokenService.issueTokenPair.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const result = await authService.loginWithPassword(
        profile.email,
        'correct-password',
      );

      expect(loginLockoutService.recordSuccess).toHaveBeenCalledWith(profile.id);
      expect(result.tokens).toEqual({
        accessToken: 'access',
        refreshToken: 'refresh',
      });
      expect(result.user).toEqual(profile);
    });
  });

  describe('startOtpLogin', () => {
    it('returns silently when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await authService.startOtpLogin(profile.email);

      expect(otpService.requestOtp).not.toHaveBeenCalled();
    });

    it('returns silently when the account is locked', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: profile.id,
        email: profile.email,
      });
      loginLockoutService.assertNotLocked.mockRejectedValue(
        new TooManyRequestsException('locked', 60),
      );

      await authService.startOtpLogin(profile.email);

      expect(otpService.requestOtp).not.toHaveBeenCalled();
    });

    it('requests an OTP when the account is unlocked', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: profile.id,
        email: profile.email,
      });

      await authService.startOtpLogin(profile.email);

      expect(otpService.requestOtp).toHaveBeenCalledWith(
        profile.email,
        OtpPurpose.LOGIN,
      );
    });
  });

  describe('verifyOtpLogin', () => {
    it('asserts lockout, verifies OTP, clears failures, and issues tokens', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({
          id: profile.id,
          email: profile.email,
        })
        .mockResolvedValueOnce(userWithAccess);
      tokenService.issueTokenPair.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const result = await authService.verifyOtpLogin(profile.email, '123456');

      expect(loginLockoutService.assertNotLocked).toHaveBeenCalledWith(profile.id);
      expect(otpService.verifyOtp).toHaveBeenCalledWith(
        profile.email,
        OtpPurpose.LOGIN,
        '123456',
      );
      expect(loginLockoutService.recordSuccess).toHaveBeenCalledWith(profile.id);
      expect(result.user).toEqual(profile);
    });

    it('throws BadRequestException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.verifyOtpLogin(profile.email, '123456'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getProfile', () => {
    it('returns the user profile with roles and permissions when found', async () => {
      prisma.user.findUnique.mockResolvedValue(userWithAccess);

      await expect(authService.getProfile(profile.id)).resolves.toEqual(profile);
    });

    it('throws NotFoundException when missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.getProfile(profile.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
