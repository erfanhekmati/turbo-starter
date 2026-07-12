import { TooManyRequestsException } from '../exceptions/too-many-requests.exception';
import { LOGIN_LOCKOUT_THRESHOLD } from '../auth.constants';
import { LoginLockoutService } from './login-lockout.service';

describe('LoginLockoutService', () => {
  let prisma: {
    loginLockout: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
      deleteMany: jest.Mock;
    };
  };
  let service: LoginLockoutService;

  beforeEach(() => {
    prisma = {
      loginLockout: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
    };
    service = new LoginLockoutService(prisma as never);
  });

  describe('assertNotLocked', () => {
    it('does nothing when there is no lockout record', async () => {
      prisma.loginLockout.findUnique.mockResolvedValue(null);
      await expect(service.assertNotLocked('user-1')).resolves.toBeUndefined();
    });

    it('does nothing once lockedUntil has passed', async () => {
      prisma.loginLockout.findUnique.mockResolvedValue({
        lockedUntil: new Date(Date.now() - 1000),
      });
      await expect(service.assertNotLocked('user-1')).resolves.toBeUndefined();
    });

    it('throws while still within the lockout window', async () => {
      prisma.loginLockout.findUnique.mockResolvedValue({
        lockedUntil: new Date(Date.now() + 60_000),
      });
      await expect(service.assertNotLocked('user-1')).rejects.toBeInstanceOf(
        TooManyRequestsException,
      );
    });
  });

  describe('recordFailure', () => {
    it('increments failedAttempts without locking below the threshold', async () => {
      prisma.loginLockout.findUnique.mockResolvedValue({ failedAttempts: 1 });

      await service.recordFailure('user-1');

      expect(prisma.loginLockout.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { failedAttempts: 2, lockedUntil: null },
        }),
      );
    });

    it('locks the account once the failure threshold is reached', async () => {
      prisma.loginLockout.findUnique.mockResolvedValue({
        failedAttempts: LOGIN_LOCKOUT_THRESHOLD - 1,
      });

      await service.recordFailure('user-1');

      const call = prisma.loginLockout.upsert.mock.calls[0][0];
      expect(call.update.failedAttempts).toBe(LOGIN_LOCKOUT_THRESHOLD);
      expect(call.update.lockedUntil).toBeInstanceOf(Date);
    });
  });

  describe('recordSuccess', () => {
    it('clears any existing lockout record', async () => {
      await service.recordSuccess('user-1');
      expect(prisma.loginLockout.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });
});
