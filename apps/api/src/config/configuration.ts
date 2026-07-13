import { SwaggerThemeNameEnum } from 'swagger-themes';
import { JwtTtl } from './enums';

const int = (value: string | undefined, fallback: number): number =>
  value ? parseInt(value, 10) : fallback;

export default () => ({
  app: {
    port: int(process.env.PORT, 8000),
    version: '1.0.0',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    corsOrigins: process.env.CORS_ORIGINS?.split(',').map((origin) =>
      origin.trim(),
    ),
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    accessTokenTtl: process.env.JWT_ACCESS_TTL ?? JwtTtl.FifteenMinutes,
    refreshTokenTtl: process.env.JWT_REFRESH_TTL ?? JwtTtl.SevenDays,
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  },
  otp: {
    hashSecret: process.env.OTP_HASH_SECRET,
    length: int(process.env.OTP_LENGTH, 6),
    ttlMinutes: int(process.env.OTP_TTL_MINUTES, 10),
    resendCooldownSeconds: int(process.env.OTP_RESEND_COOLDOWN_SECONDS, 30),
    maxSendsPerWindow: int(process.env.OTP_MAX_SENDS_PER_WINDOW, 3),
    sendWindowMinutes: int(process.env.OTP_SEND_WINDOW_MINUTES, 10),
    maxVerifyAttempts: int(process.env.OTP_MAX_VERIFY_ATTEMPTS, 5),
  },
  auth: {
    registrationSessionTtlMinutes: int(
      process.env.REGISTRATION_SESSION_TTL_MINUTES,
      30,
    ),
    passwordResetSessionTtlMinutes: int(
      process.env.PASSWORD_RESET_SESSION_TTL_MINUTES,
      30,
    ),
    loginLockoutThreshold: int(process.env.LOGIN_LOCKOUT_THRESHOLD, 5),
    loginLockoutMinutes: int(process.env.LOGIN_LOCKOUT_MINUTES, 15),
  },
  mail: {
    host: process.env.SMTP_HOST,
    port: int(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
    secure: process.env.SMTP_SECURE === 'true',
  },
  swagger: {
    title: 'Rest API Docs',
    description:
      'This provides comprehensive documentation for all rest API endpoints',
    path: 'api-docs',
    theme: SwaggerThemeNameEnum.DARK,
  },
});
