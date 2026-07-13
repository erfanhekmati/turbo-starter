export const AUTH_MODULE_OPTIONS = 'AUTH_MODULE_OPTIONS';

// Defaults applied to any config field left unset in `AuthModuleOptions`.
// See `resolveAuthModuleOptions` in `auth-module-options.resolver.ts`.
export const DEFAULT_OTP_LENGTH = 6;
export const DEFAULT_OTP_TTL_MINUTES = 10;
export const DEFAULT_OTP_RESEND_COOLDOWN_SECONDS = 30;
export const DEFAULT_OTP_MAX_SENDS_PER_WINDOW = 3;
export const DEFAULT_OTP_SEND_WINDOW_MINUTES = 10;
export const DEFAULT_OTP_MAX_VERIFY_ATTEMPTS = 5;

export const DEFAULT_REGISTRATION_SESSION_TTL_MINUTES = 30;
export const DEFAULT_PASSWORD_RESET_SESSION_TTL_MINUTES = 30;

export const DEFAULT_LOGIN_LOCKOUT_THRESHOLD = 5;
export const DEFAULT_LOGIN_LOCKOUT_MINUTES = 15;
