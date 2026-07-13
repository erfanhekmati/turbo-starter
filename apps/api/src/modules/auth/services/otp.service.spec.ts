import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { OtpPurpose, PrismaService } from '@repo/database';
import { TooManyRequestsException } from '../../../common/exceptions';
import { EmailService } from '../../email/email.service';
import { OtpService } from './otp.service';

describe('OtpService', () => {
  let otpService: OtpService;
  let prisma: {
    otpChallenge: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
      delete: jest.Mock;
      update: jest.Mock;
    };
  };
  let emailService: { sendOtpEmail: jest.Mock };
  let config: { getOrThrow: jest.Mock };

  beforeEach(async () => {
    prisma = {
      otpChallenge: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
    };
    emailService = { sendOtpEmail: jest.fn() };
    config = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string | number> = {
          'otp.hashSecret': 'test-secret',
          'otp.length': 6,
          'otp.ttlMinutes': 10,
          'otp.resendCooldownSeconds': 30,
          'otp.maxSendsPerWindow': 3,
          'otp.sendWindowMinutes': 10,
          'otp.maxVerifyAttempts': 5,
        };
        return values[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    otpService = module.get(OtpService);
  });

  describe('requestOtp', () => {
    it('upserts a challenge and sends the email', async () => {
      prisma.otpChallenge.findUnique.mockResolvedValue(null);
      prisma.otpChallenge.upsert.mockResolvedValue({});
      emailService.sendOtpEmail.mockResolvedValue(undefined);

      await otpService.requestOtp('jane@example.com', OtpPurpose.LOGIN);

      expect(prisma.otpChallenge.upsert).toHaveBeenCalled();
      expect(emailService.sendOtpEmail).toHaveBeenCalledWith(
        'jane@example.com',
        expect.any(String),
        OtpPurpose.LOGIN,
      );
    });

    it('deletes the challenge when email sending fails', async () => {
      prisma.otpChallenge.findUnique.mockResolvedValue(null);
      prisma.otpChallenge.upsert.mockResolvedValue({});
      emailService.sendOtpEmail.mockRejectedValue(new Error('SMTP down'));
      prisma.otpChallenge.delete.mockResolvedValue({});

      await expect(
        otpService.requestOtp('jane@example.com', OtpPurpose.LOGIN),
      ).rejects.toThrow('SMTP down');

      expect(prisma.otpChallenge.delete).toHaveBeenCalledWith({
        where: {
          email_purpose: {
            email: 'jane@example.com',
            purpose: OtpPurpose.LOGIN,
          },
        },
      });
    });

    it('throws TooManyRequestsException during resend cooldown', async () => {
      prisma.otpChallenge.findUnique.mockResolvedValue({
        resendAvailableAt: new Date(Date.now() + 20_000),
        windowStartAt: new Date(),
        sentCount: 1,
      });

      await expect(
        otpService.requestOtp('jane@example.com', OtpPurpose.LOGIN),
      ).rejects.toThrow(TooManyRequestsException);
    });
  });

  describe('verifyOtp', () => {
    it('throws BadRequestException when no challenge exists', async () => {
      prisma.otpChallenge.findUnique.mockResolvedValue(null);

      await expect(
        otpService.verifyOtp('jane@example.com', OtpPurpose.LOGIN, '123456'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
