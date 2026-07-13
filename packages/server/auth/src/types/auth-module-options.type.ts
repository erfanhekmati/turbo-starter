import type { OtpPurpose } from '@repo/database';

export interface SendOtpEmailParams {
  email: string;
  code: string;
  purpose: OtpPurpose;
}

/**
 * Delivers an OTP code to the user. The auth package has no mail transport
 * of its own — the host app supplies this callback (e.g. backed by its own
 * email module) so it can own how and where mail actually gets sent.
 */
export type SendOtpEmail = (params: SendOtpEmailParams) => Promise<void>;

export interface AuthModuleOptions {
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtl: string;
    refreshTtl: string;
  };
  otpSecret: string;
  sendOtpEmail: SendOtpEmail;
  otp?: {
    /** Number of digits in a generated OTP code. */
    length?: number;
    /** How long a generated code stays valid. */
    ttlMinutes?: number;
    /** Minimum gap between two sends for the same email + purpose. */
    resendCooldownSeconds?: number;
    /** Max sends allowed within `sendWindowMinutes`. */
    maxSendsPerWindow?: number;
    /** Rolling window the send-count limit is measured over. */
    sendWindowMinutes?: number;
    /** Wrong-code attempts allowed before the challenge is invalidated. */
    maxVerifyAttempts?: number;
  };
  registration?: {
    /** How long an in-progress registration session stays valid. */
    sessionTtlMinutes?: number;
  };
  passwordReset?: {
    /** How long an in-progress password reset session stays valid. */
    sessionTtlMinutes?: number;
  };
  loginLockout?: {
    /** Consecutive failed password logins before lockout. */
    threshold?: number;
    /** Lockout duration once the threshold is hit. */
    lockoutMinutes?: number;
  };
}

/**
 * `AuthModuleOptions` with every optional sub-config filled in from defaults.
 * This is the shape injected into services at runtime.
 */
export interface ResolvedAuthModuleOptions {
  jwt: AuthModuleOptions['jwt'];
  otpSecret: string;
  sendOtpEmail: SendOtpEmail;
  otp: Required<NonNullable<AuthModuleOptions['otp']>>;
  registration: Required<NonNullable<AuthModuleOptions['registration']>>;
  passwordReset: Required<NonNullable<AuthModuleOptions['passwordReset']>>;
  loginLockout: Required<NonNullable<AuthModuleOptions['loginLockout']>>;
}
