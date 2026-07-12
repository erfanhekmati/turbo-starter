import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { join } from 'node:path';
import { AuthModule } from '@repo/auth';
import { DatabaseModule } from '@repo/database';
import configuration from './config/configuration';
import { validate } from './config/env.validation';

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
    AuthModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        jwt: {
          accessSecret: config.getOrThrow<string>('jwt.accessSecret'),
          refreshSecret: config.getOrThrow<string>('jwt.refreshSecret'),
          accessTtl: config.getOrThrow<string>('jwt.accessTokenTtl'),
          refreshTtl: config.getOrThrow<string>('jwt.refreshTokenTtl'),
        },
        otpSecret: config.getOrThrow<string>('otp.hashSecret'),
        mail: {
          host: config.getOrThrow<string>('mail.host'),
          port: config.getOrThrow<number>('mail.port'),
          user: config.getOrThrow<string>('mail.user'),
          password: config.getOrThrow<string>('mail.password'),
          from: config.getOrThrow<string>('mail.from'),
          secure: config.get<boolean>('mail.secure'),
        },
      }),
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
