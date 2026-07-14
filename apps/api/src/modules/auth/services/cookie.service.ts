import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import type { AuthTokens } from '../types';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

@Injectable()
export class CookieService {
  constructor(private readonly config: ConfigService) {}

  setAuthCookies(res: Response, tokens: AuthTokens): void {
    res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, this.accessCookieOptions());
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      tokens.refreshToken,
      this.refreshCookieOptions(),
    );
  }

  clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, this.baseCookieOptions());
    res.clearCookie(REFRESH_TOKEN_COOKIE, this.baseCookieOptions());
  }

  private accessCookieOptions(): CookieOptions {
    return {
      ...this.baseCookieOptions(),
      maxAge: this.ttlToMs(
        this.config.getOrThrow<string>('jwt.accessTokenTtl'),
      ),
    };
  }

  private refreshCookieOptions(): CookieOptions {
    return {
      ...this.baseCookieOptions(),
      maxAge: this.ttlToMs(
        this.config.getOrThrow<string>('jwt.refreshTokenTtl'),
      ),
    };
  }

  private baseCookieOptions(): CookieOptions {
    const isProduction =
      this.config.getOrThrow<string>('app.nodeEnv') === 'production';
    const domain = this.config.get<string>('cookie.domain');

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      ...(domain ? { domain } : {}),
    };
  }

  private ttlToMs(ttl: string): number {
    const match = /^(\d+)([smhd])$/i.exec(ttl.trim());
    if (!match) {
      return 15 * 60 * 1000;
    }

    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };

    return value * (multipliers[unit] ?? 60_000);
  }
}
