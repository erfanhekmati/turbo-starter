import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { RefreshTokenPayload } from '@repo/auth';
import { hashToken } from '../utils/hmac.util';
import { TokenService } from './token.service';

describe('TokenService', () => {
  const configValues: Record<string, string> = {
    'jwt.accessSecret': 'access-secret',
    'jwt.refreshSecret': 'refresh-secret',
    'jwt.accessTokenTtl': '15m',
    'jwt.refreshTokenTtl': '7d',
  };
  const config = {
    getOrThrow: jest.fn((key: string) => configValues[key]),
  };

  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync' | 'verifyAsync' | 'decode'>>;
  let prisma: {
    refreshToken: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    user: { findUnique: jest.Mock };
  };
  let service: TokenService;
  let tokenCounter = 0;
  const payload: RefreshTokenPayload = { sub: 'user-1', jti: 'jti-1' };

  beforeEach(() => {
    tokenCounter = 0;
    jwtService = {
      signAsync: jest.fn().mockImplementation(async () => `token-${tokenCounter++}`),
      verifyAsync: jest.fn(),
      decode: jest.fn().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 }),
    };
    prisma = {
      refreshToken: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: { findUnique: jest.fn() },
    };
    service = new TokenService(
      jwtService as unknown as JwtService,
      prisma as never,
      config as never,
    );
  });

  describe('issueTokenPair', () => {
    it('signs an access and refresh token and persists the refresh token hash', async () => {
      const tokens = await service.issueTokenPair('user-1', 'user@example.com');

      expect(tokens.accessToken).toBe('token-0');
      expect(tokens.refreshToken).toBe('token-1');
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          tokenHash: hashToken('token-1'),
        }),
      });
    });
  });

  describe('rotateRefreshToken', () => {
    it('rotates a valid, unrevoked refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'stored-1',
        userId: 'user-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
      });

      const tokens = await service.rotateRefreshToken('old-refresh-token', payload);

      expect(tokens.accessToken).toBeDefined();
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'stored-1' },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      });
    });

    it('revokes all tokens for the user and rejects on refresh token reuse', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'stored-1',
        userId: 'user-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        service.rotateRefreshToken('reused-token', payload),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('rejects when the token is not a known refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.rotateRefreshToken('unknown-token', payload),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects when the refresh token has expired in storage', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'stored-1',
        userId: 'user-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.rotateRefreshToken('expired-token', payload),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
