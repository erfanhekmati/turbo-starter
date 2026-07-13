import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService, User } from '@repo/database';
import { EmailService } from '../../email/email.service';
import { OtpService } from './otp.service';
import { PasswordHasherService } from './password-hasher.service';
import { RegistrationService } from './registration.service';
import { TokenService } from './token.service';

describe('RegistrationService', () => {
  let registrationService: RegistrationService;
  let prisma: {
    user: { findUnique: jest.Mock };
    registrationSession: { upsert: jest.Mock };
  };
  let otpService: { requestOtp: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      registrationSession: { upsert: jest.fn() },
    };
    otpService = { requestOtp: jest.fn() };

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
        { provide: PasswordHasherService, useValue: {} },
        { provide: TokenService, useValue: {} },
        { provide: EmailService, useValue: {} },
      ],
    }).compile();

    registrationService = module.get(RegistrationService);
  });

  describe('start', () => {
    it('returns an opaque id without sending OTP when email is registered', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
      } as User);

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
});
