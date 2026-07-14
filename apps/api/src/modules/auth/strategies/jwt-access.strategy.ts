import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { PrismaService } from '@repo/database';
import { Strategy } from 'passport-jwt';
import type { AccessTokenPayload, AuthenticatedUser } from '../types';
import { extractAccessToken } from '../utils/jwt-extractors.util';
import { flattenUserAccess, userAccessSelect } from '../utils/user-access.util';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: extractAccessToken,
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: userAccessSelect,
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    const profile = flattenUserAccess(user);

    return {
      id: profile.id,
      email: profile.email,
      roles: profile.roles,
      permissions: profile.permissions,
    };
  }
}
