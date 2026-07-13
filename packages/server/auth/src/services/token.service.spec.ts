import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { ResolvedAuthModuleOptions } from '../types/auth-module-options.type';
import { hashToken } from '../utils/hmac.util';
import { TokenService } from './token.service';

describe('TokenService', () => {
  const options = {
    jwt: {
      accessSecret: 'access-secret',
      refreshSecret: 'refresh-secret',
      accessTtl: '15m',
      refreshTtl: '7d',
    },
  } as ResolvedAuthModuleOptions;

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
      options,
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
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', jti: 'jti-1' });
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

      const tokens = await service.rotateRefreshToken('old-refresh-token');

      expect(tokens.accessToken).toBeDefined();
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'stored-1' },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      });
    });

    it('revokes all tokens for the user and rejects on refresh token reuse', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', jti: 'jti-1' });
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'stored-1',
        userId: 'user-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(service.rotateRefreshToken('reused-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('rejects when the token is not a known refresh token', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', jti: 'jti-1' });
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.rotateRefreshToken('unknown-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects when the JWT signature/expiry check fails', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid signature'));

      await expect(service.rotateRefreshToken('garbage')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
