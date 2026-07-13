import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@repo/database';
import { RoleName } from '@repo/backend-types';
import { EmailService } from '../../email/email.service';
import { OtpService } from './otp.service';
import { PasswordHasherService } from './password-hasher.service';
import { RegistrationService } from './registration.service';
import { TokenService } from './token.service';

describe('RegistrationService', () => {
  let registrationService: RegistrationService;
  let prisma: {
    user: { findUnique: jest.Mock; findUniqueOrThrow: jest.Mock; create: jest.Mock };
    registrationSession: {
      upsert: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
    role: { findUnique: jest.Mock };
    userRole: { create: jest.Mock };
    $transaction: jest.Mock;
  };
  let otpService: { requestOtp: jest.Mock; verifyOtp: jest.Mock };
  let passwordHasher: { hash: jest.Mock };
  let tokenService: { issueTokenPair: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
      },
      registrationSession: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      role: { findUnique: jest.fn() },
      userRole: { create: jest.fn() },
      $transaction: jest.fn(),
    };
    otpService = { requestOtp: jest.fn(), verifyOtp: jest.fn() };
    passwordHasher = { hash: jest.fn().mockResolvedValue('hashed-password') };
    tokenService = {
      issueTokenPair: jest.fn().mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      }),
    };

    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof prisma) => Promise<string>) =>
        callback(prisma),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue(30),
          },
        },
        { provide: OtpService, useValue: otpService },
        { provide: PasswordHasherService, useValue: passwordHasher },
        { provide: TokenService, useValue: tokenService },
        { provide: EmailService, useValue: { sendWelcomeEmail: jest.fn() } },
      ],
    }).compile();

    registrationService = module.get(RegistrationService);
  });

  describe('start', () => {
    it('returns an opaque id without sending OTP when email is registered', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
      });

      const registrationId = await registrationService.start(
        'jane@example.com',
      );

      expect(registrationId).toEqual(expect.any(String));
      expect(prisma.registrationSession.upsert).not.toHaveBeenCalled();
      expect(otpService.requestOtp).not.toHaveBeenCalled();
    });

    it('creates a session and requests OTP for new emails', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.registrationSession.upsert.mockResolvedValue({ id: 'session-1' });

      const registrationId = await registrationService.start(
        'new@example.com',
      );

      expect(registrationId).toBe('session-1');
      expect(otpService.requestOtp).toHaveBeenCalled();
    });
  });

  describe('complete', () => {
    it('assigns the default USER role and returns roles in the profile', async () => {
      prisma.registrationSession.findUnique.mockResolvedValue({
        id: 'session-1',
        email: 'new@example.com',
        step: 'EMAIL_VERIFIED',
        expiresAt: new Date(Date.now() + 60_000),
      });
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'new@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        emailVerifiedAt: new Date(),
      });
      prisma.role.findUnique.mockResolvedValue({
        id: 'role-user',
        name: RoleName.USER,
      });
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        id: 'user-1',
        email: 'new@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        roles: [
          {
            role: {
              name: RoleName.USER,
              permissions: [{ permission: { key: 'users:read' } }],
            },
          },
        ],
      });

      const result = await registrationService.complete(
        'session-1',
        'Jane',
        'Doe',
        'password',
      );

      expect(prisma.userRole.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          roleId: 'role-user',
        },
      });
      expect(result.user.roles).toEqual([RoleName.USER]);
      expect(result.user.permissions).toEqual(['users:read']);
    });

    it('throws when the default USER role is missing', async () => {
      prisma.registrationSession.findUnique.mockResolvedValue({
        id: 'session-1',
        email: 'new@example.com',
        step: 'EMAIL_VERIFIED',
        expiresAt: new Date(Date.now() + 60_000),
      });
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'new@example.com',
      });
      prisma.role.findUnique.mockResolvedValue(null);

      await expect(
        registrationService.complete('session-1', 'Jane', 'Doe', 'password'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('throws when email has not been verified', async () => {
      prisma.registrationSession.findUnique.mockResolvedValue({
        id: 'session-1',
        email: 'new@example.com',
        step: 'EMAIL_PENDING_VERIFICATION',
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        registrationService.complete('session-1', 'Jane', 'Doe', 'password'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
