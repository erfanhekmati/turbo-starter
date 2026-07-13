import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRefreshRequest } from '../types/authenticated-refresh-request.type';
import type { RefreshTokenPayload } from '../types/jwt-payload.type';

export const CurrentRefreshToken = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): RefreshTokenPayload => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRefreshRequest>();
    return request.user;
  },
);
