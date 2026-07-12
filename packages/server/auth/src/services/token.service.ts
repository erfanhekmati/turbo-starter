import { randomUUID } from 'node:crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { PrismaService } from '@repo/database';
import { AUTH_MODULE_OPTIONS } from '../auth.constants';
import type { AuthModuleOptions } from '../types/auth-module-options.type';
import type { AuthTokens } from '../types/auth-tokens.type';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '../types/jwt-payload.type';
import { hashToken } from '../utils/hmac.util';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    @Inject(AUTH_MODULE_OPTIONS) private readonly options: AuthModuleOptions,
  ) {}

  async issueTokenPair(userId: string, email: string): Promise<AuthTokens> {
    const accessPayload: AccessTokenPayload = { sub: userId, email };
    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.options.jwt.accessSecret,
      expiresIn: this.options.jwt.accessTtl as JwtSignOptions['expiresIn'],
    });

    const refreshPayload: RefreshTokenPayload = { sub: userId, jti: randomUUID() };
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.options.jwt.refreshSecret,
      expiresIn: this.options.jwt.refreshTtl as JwtSignOptions['expiresIn'],
    });

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: this.extractExpiry(refreshToken),
      },
    });

    return { accessToken, refreshToken };
  }

  async rotateRefreshToken(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

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

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.issueTokenPair(user.id, user.email);

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: {
        revokedAt: new Date(),
        replacedByTokenHash: hashToken(tokens.refreshToken),
      },
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

  private async verifyRefreshToken(refreshToken: string): Promise<RefreshTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.options.jwt.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private extractExpiry(token: string): Date {
    const decoded = this.jwtService.decode<{ exp: number }>(token);
    return new Date(decoded.exp * 1000);
  }
}
