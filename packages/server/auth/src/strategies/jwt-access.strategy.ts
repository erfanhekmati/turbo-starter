import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_AUTH_MODULE_OPTIONS } from '../jwt-auth.constants';
import type { JwtAuthModuleOptions } from '../types/jwt-auth-module-options.type';
import type { AccessTokenPayload } from '../types/jwt-payload.type';
import type { AuthenticatedUser } from '../types/authenticated-user.type';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    @Inject(JWT_AUTH_MODULE_OPTIONS) options: JwtAuthModuleOptions,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: options.accessSecret,
    });
  }

  validate(payload: AccessTokenPayload): AuthenticatedUser {
    return { id: payload.sub, email: payload.email };
  }
}
