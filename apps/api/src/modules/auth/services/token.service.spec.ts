import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@repo/database';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let tokenService: TokenService;
  let prisma: {
    refreshToken: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    user: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock; decode: jest.Mock };

  beforeEach(async () => {
    prisma = {
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      user: { findUnique: jest.fn() },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          refreshToken: {
            create: prisma.refreshToken.create,
            update: prisma.refreshToken.update,
          },
        }),
      ),
    };
    jwtService = {
      signAsync: jest.fn(),
      decode: jest.fn().mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const values: Record<string, string> = {
                'jwt.accessSecret': 'access',
                'jwt.refreshSecret': 'refresh',
                'jwt.accessTokenTtl': '15m',
                'jwt.refreshTokenTtl': '7d',
              };
              return values[key];
            }),
          },
        },
      ],
    }).compile();

    tokenService = module.get(TokenService);
  });

  describe('rotateRefreshToken', () => {
    it('rotates tokens inside a transaction', async () => {
      const stored = {
        id: 'rt-1',
        userId: 'user-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      };
      prisma.refreshToken.findUnique.mockResolvedValue(stored);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'jane@example.com',
      });
      jwtService.signAsync
        .mockResolvedValueOnce('new-access')
        .mockResolvedValueOnce('new-refresh');
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.refreshToken.update.mockResolvedValue({});

      const tokens = await tokenService.rotateRefreshToken('old-refresh', {
        sub: 'user-1',
        jti: 'jti-1',
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.refreshToken.create).toHaveBeenCalled();
      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rt-1' } }),
      );
      expect(tokens).toEqual({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
    });

    it('throws when the refresh token is unknown', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        tokenService.rotateRefreshToken('missing', {
          sub: 'user-1',
          jti: 'jti-1',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
