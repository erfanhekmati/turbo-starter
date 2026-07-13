import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRefreshRequest, RefreshTokenPayload } from '../types';

export const CurrentRefreshToken = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): RefreshTokenPayload => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRefreshRequest>();
    return request.user;
  },
);
