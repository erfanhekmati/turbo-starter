import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { join } from 'node:path';
import { AuthModule } from '@repo/auth';
import { DatabaseModule } from '@repo/database';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { EmailModule } from './email/email.module';
import { EmailService } from './email/email.service';

const packageRoot = join(__dirname, '..');
const monorepoRoot = join(packageRoot, '..', '..');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 30 }],
    }),
    DatabaseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connectionString: config.getOrThrow<string>('DATABASE_URL'),
      }),
    }),
    EmailModule,
    AuthModule.forRootAsync({
      imports: [ConfigModule, EmailModule],
      inject: [ConfigService, EmailService],
      useFactory: (config: ConfigService, emailService: EmailService) => ({
        jwt: {
          accessSecret: config.getOrThrow<string>('jwt.accessSecret'),
          refreshSecret: config.getOrThrow<string>('jwt.refreshSecret'),
          accessTtl: config.getOrThrow<string>('jwt.accessTokenTtl'),
          refreshTtl: config.getOrThrow<string>('jwt.refreshTokenTtl'),
        },
        otpSecret: config.getOrThrow<string>('otp.hashSecret'),
        sendOtpEmail: ({ email, code, purpose }) =>
          emailService.sendOtpEmail(email, code, purpose),
      }),
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
