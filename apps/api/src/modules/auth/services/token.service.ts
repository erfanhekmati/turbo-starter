import { randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { hashToken } from '@repo/backend-utils';
import { Prisma, PrismaService } from '@repo/database';
import type { AccessTokenPayload, AuthTokens, RefreshTokenPayload } from '../types';

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async issueTokenPair(userId: string, email: string): Promise<AuthTokens> {
    const tokens = await this.signTokenPair(userId, email);
    await this.persistRefreshToken(this.prisma, userId, tokens.refreshToken);
    return tokens;
  }

  async rotateRefreshToken(
    refreshToken: string,
    payload: RefreshTokenPayload,
  ): Promise<AuthTokens> {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.revokedAt) {
      await this.revokeAllForUser(stored.userId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.signTokenPair(user.id, user.email);
    const newRefreshHash = hashToken(tokens.refreshToken);

    await this.prisma.$transaction(async (tx) => {
      await this.persistRefreshToken(tx, user.id, tokens.refreshToken);
      await tx.refreshToken.update({
        where: { id: stored.id },
        data: {
          revokedAt: new Date(),
          replacedByTokenHash: newRefreshHash,
        },
      });
    });

    return tokens;
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async signTokenPair(
    userId: string,
    email: string,
  ): Promise<AuthTokens> {
    const accessPayload: AccessTokenPayload = { sub: userId, email };
    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.config.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: this.config.getOrThrow<string>(
        'jwt.accessTokenTtl',
      ) as JwtSignOptions['expiresIn'],
    });

    const refreshPayload: RefreshTokenPayload = {
      sub: userId,
      jti: randomUUID(),
    };
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: this.config.getOrThrow<string>(
        'jwt.refreshTokenTtl',
      ) as JwtSignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
  }

  private async persistRefreshToken(
    client: PrismaClientLike,
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    await client.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: this.extractExpiry(refreshToken),
      },
    });
  }

  private extractExpiry(token: string): Date {
    const decoded = this.jwtService.decode<{ exp: number }>(token);
    return new Date(decoded.exp * 1000);
  }
}
