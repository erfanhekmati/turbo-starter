import {
  DEFAULT_LOGIN_LOCKOUT_MINUTES,
  DEFAULT_LOGIN_LOCKOUT_THRESHOLD,
  DEFAULT_OTP_LENGTH,
  DEFAULT_OTP_MAX_SENDS_PER_WINDOW,
  DEFAULT_OTP_MAX_VERIFY_ATTEMPTS,
  DEFAULT_OTP_RESEND_COOLDOWN_SECONDS,
  DEFAULT_OTP_SEND_WINDOW_MINUTES,
  DEFAULT_OTP_TTL_MINUTES,
  DEFAULT_PASSWORD_RESET_SESSION_TTL_MINUTES,
  DEFAULT_REGISTRATION_SESSION_TTL_MINUTES,
} from './auth.constants';
import type {
  AuthModuleOptions,
  ResolvedAuthModuleOptions,
} from './types/auth-module-options.type';

export function resolveAuthModuleOptions(
  options: AuthModuleOptions,
): ResolvedAuthModuleOptions {
  return {
    jwt: options.jwt,
    otpSecret: options.otpSecret,
    sendOtpEmail: options.sendOtpEmail,
    otp: {
      length: options.otp?.length ?? DEFAULT_OTP_LENGTH,
      ttlMinutes: options.otp?.ttlMinutes ?? DEFAULT_OTP_TTL_MINUTES,
      resendCooldownSeconds:
        options.otp?.resendCooldownSeconds ?? DEFAULT_OTP_RESEND_COOLDOWN_SECONDS,
      maxSendsPerWindow:
        options.otp?.maxSendsPerWindow ?? DEFAULT_OTP_MAX_SENDS_PER_WINDOW,
      sendWindowMinutes: options.otp?.sendWindowMinutes ?? DEFAULT_OTP_SEND_WINDOW_MINUTES,
      maxVerifyAttempts:
        options.otp?.maxVerifyAttempts ?? DEFAULT_OTP_MAX_VERIFY_ATTEMPTS,
    },
    registration: {
      sessionTtlMinutes:
        options.registration?.sessionTtlMinutes ??
        DEFAULT_REGISTRATION_SESSION_TTL_MINUTES,
    },
    passwordReset: {
      sessionTtlMinutes:
        options.passwordReset?.sessionTtlMinutes ??
        DEFAULT_PASSWORD_RESET_SESSION_TTL_MINUTES,
    },
    loginLockout: {
      threshold: options.loginLockout?.threshold ?? DEFAULT_LOGIN_LOCKOUT_THRESHOLD,
      lockoutMinutes:
        options.loginLockout?.lockoutMinutes ?? DEFAULT_LOGIN_LOCKOUT_MINUTES,
    },
  };
}
