import { OtpPurpose } from '@repo/database';
import type { ResolvedAuthModuleOptions } from '../types/auth-module-options.type';
import { TooManyRequestsException } from '../exceptions/too-many-requests.exception';
import { hashOtp } from '../utils/hmac.util';
import { OtpService } from './otp.service';

describe('OtpService', () => {
  const otpSecret = 'test-secret';
  const sendOtpEmail = jest.fn().mockResolvedValue(undefined);
  const options: ResolvedAuthModuleOptions = {
    jwt: {
      accessSecret: 'access-secret',
      refreshSecret: 'refresh-secret',
      accessTtl: '15m',
      refreshTtl: '7d',
    },
    otpSecret,
    sendOtpEmail,
    otp: {
      length: 6,
      ttlMinutes: 10,
      resendCooldownSeconds: 30,
      maxSendsPerWindow: 3,
      sendWindowMinutes: 10,
      maxVerifyAttempts: 5,
    },
    registration: { sessionTtlMinutes: 30 },
    passwordReset: { sessionTtlMinutes: 30 },
    loginLockout: { threshold: 5, lockoutMinutes: 15 },
  };

  let prisma: {
    otpChallenge: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let service: OtpService;

  beforeEach(() => {
    sendOtpEmail.mockClear();
    prisma = {
      otpChallenge: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new OtpService(prisma as never, options);
  });

  describe('requestOtp', () => {
    it('creates a new challenge and sends an email when none exists', async () => {
      prisma.otpChallenge.findUnique.mockResolvedValue(null);
      prisma.otpChallenge.upsert.mockResolvedValue({});

      await service.requestOtp('user@example.com', OtpPurpose.LOGIN);

      expect(prisma.otpChallenge.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            email: 'user@example.com',
            purpose: OtpPurpose.LOGIN,
            sentCount: 1,
          }),
        }),
      );
      expect(sendOtpEmail).toHaveBeenCalledTimes(1);
    });

    it('throws within the 30s resend cooldown window', async () => {
      const now = new Date();
      prisma.otpChallenge.findUnique.mockResolvedValue({
        windowStartAt: now,
        sentCount: 1,
        resendAvailableAt: new Date(now.getTime() + 20_000),
        expiresAt: new Date(now.getTime() + 600_000),
        attempts: 0,
      });

      await expect(
        service.requestOtp('user@example.com', OtpPurpose.LOGIN),
      ).rejects.toBeInstanceOf(TooManyRequestsException);
      expect(sendOtpEmail).not.toHaveBeenCalled();
    });

    it('throws once max sends per 10-minute window has been reached', async () => {
      const now = new Date();
      prisma.otpChallenge.findUnique.mockResolvedValue({
        windowStartAt: now,
        sentCount: 3,
        resendAvailableAt: new Date(now.getTime() - 1000),
        expiresAt: new Date(now.getTime() + 600_000),
        attempts: 0,
      });

      await expect(
        service.requestOtp('user@example.com', OtpPurpose.LOGIN),
      ).rejects.toBeInstanceOf(TooManyRequestsException);
      expect(sendOtpEmail).not.toHaveBeenCalled();
    });

    it('resets the send window once the previous window has elapsed', async () => {
      const past = new Date(Date.now() - 11 * 60_000);
      prisma.otpChallenge.findUnique.mockResolvedValue({
        windowStartAt: past,
        sentCount: 3,
        resendAvailableAt: new Date(past.getTime() + 1000),
        expiresAt: new Date(past.getTime() + 600_000),
        attempts: 0,
      });
      prisma.otpChallenge.upsert.mockResolvedValue({});

      await service.requestOtp('user@example.com', OtpPurpose.LOGIN);

      expect(prisma.otpChallenge.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ sentCount: 1 }),
        }),
      );
    });
  });

  describe('verifyOtp', () => {
    it('throws when no challenge exists for the email/purpose', async () => {
      prisma.otpChallenge.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyOtp('user@example.com', OtpPurpose.LOGIN, '123456'),
      ).rejects.toThrow('Invalid or expired code');
    });

    it('deletes and rejects an expired challenge', async () => {
      prisma.otpChallenge.findUnique.mockResolvedValue({
        id: 'challenge-1',
        expiresAt: new Date(Date.now() - 1000),
        attempts: 0,
        codeHash: 'irrelevant',
      });

      await expect(
        service.verifyOtp('user@example.com', OtpPurpose.LOGIN, '123456'),
      ).rejects.toThrow();
      expect(prisma.otpChallenge.delete).toHaveBeenCalledWith({
        where: { id: 'challenge-1' },
      });
    });

    it('increments attempts on a wrong code without deleting the challenge', async () => {
      prisma.otpChallenge.findUnique.mockResolvedValue({
        id: 'challenge-1',
        expiresAt: new Date(Date.now() + 600_000),
        attempts: 0,
        codeHash: hashOtp('123456', otpSecret),
      });

      await expect(
        service.verifyOtp('user@example.com', OtpPurpose.LOGIN, '000000'),
      ).rejects.toThrow();
      expect(prisma.otpChallenge.update).toHaveBeenCalledWith({
        where: { id: 'challenge-1' },
        data: { attempts: { increment: 1 } },
      });
      expect(prisma.otpChallenge.delete).not.toHaveBeenCalled();
    });

    it('deletes and rejects once max verify attempts is reached', async () => {
      prisma.otpChallenge.findUnique.mockResolvedValue({
        id: 'challenge-1',
        expiresAt: new Date(Date.now() + 600_000),
        attempts: 5,
        codeHash: hashOtp('123456', otpSecret),
      });

      await expect(
        service.verifyOtp('user@example.com', OtpPurpose.LOGIN, '123456'),
      ).rejects.toThrow();
      expect(prisma.otpChallenge.delete).toHaveBeenCalledWith({
        where: { id: 'challenge-1' },
      });
    });

    it('consumes the challenge on a correct code', async () => {
      prisma.otpChallenge.findUnique.mockResolvedValue({
        id: 'challenge-1',
        expiresAt: new Date(Date.now() + 600_000),
        attempts: 0,
        codeHash: hashOtp('123456', otpSecret),
      });

      await service.verifyOtp('user@example.com', OtpPurpose.LOGIN, '123456');

      expect(prisma.otpChallenge.delete).toHaveBeenCalledWith({
        where: { id: 'challenge-1' },
      });
    });
  });
});
