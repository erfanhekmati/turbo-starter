import { SwaggerThemeNameEnum } from 'swagger-themes';
import { JwtTtl } from './enums';

export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '8000', 10),
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
  },
  mail: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
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
