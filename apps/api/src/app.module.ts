import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { join } from 'node:path';
import { DatabaseModule } from '@repo/database';
import { AuthModule } from './modules/auth/auth.module';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { EmailModule } from './email/email.module';

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
    AuthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
