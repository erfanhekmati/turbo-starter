export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export interface MfaTokenPayload extends AccessTokenPayload {
  type: 'mfa';
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}
