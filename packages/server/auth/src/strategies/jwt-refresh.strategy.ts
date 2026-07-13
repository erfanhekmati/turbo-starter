import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_AUTH_MODULE_OPTIONS } from '../jwt-auth.constants';
import type { JwtAuthModuleOptions } from '../types/jwt-auth-module-options.type';
import type { RefreshTokenPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(@Inject(JWT_AUTH_MODULE_OPTIONS) options: JwtAuthModuleOptions) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: options.refreshSecret,
    });
  }

  validate(payload: RefreshTokenPayload): RefreshTokenPayload {
    return payload;
  }
}
