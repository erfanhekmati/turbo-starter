import type { Request } from 'express';
import type { RefreshTokenPayload } from './jwt-payload.type';

export interface AuthenticatedRefreshRequest extends Request {
  user: RefreshTokenPayload;
}
