import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from '@repo/database';
import { AuthModule } from './modules/auth/auth.module';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { EmailModule } from './modules/email/email.module';
import { HealthModule } from './health/health.module';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { TooManyRequestsExceptionFilter } from './common/filters/too-many-requests.filter';

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
        connectionString: config.getOrThrow<string>('database.url'),
      }),
    }),
    EmailModule,
    AuthModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: PrismaClientExceptionFilter },
    { provide: APP_FILTER, useClass: TooManyRequestsExceptionFilter },
  ],
})
export class AppModule {}
