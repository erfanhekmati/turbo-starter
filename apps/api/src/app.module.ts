import path from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { createKeyv } from '@keyv/redis';
import { DatabaseModule } from '@repo/database';
import type Redis from 'ioredis';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { TooManyRequestsExceptionFilter } from './common/filters/too-many-requests.filter';
import { HealthModule } from './health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmailModule } from './modules/email/email.module';
import { FilesModule } from './modules/files/files.module';
import { QueueModule } from './modules/queue/queue.module';
import { REDIS_CLIENT } from './modules/redis/redis.constants';
import { RedisThrottlerStorageService } from './modules/redis/redis-throttler-storage.service';
import { RedisModule } from './modules/redis/redis.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '../../.env'),
      ],
      load: [configuration],
      validate,
    }),
    RedisModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        stores: [createKeyv(config.getOrThrow<string>('redis.url'))],
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [REDIS_CLIENT],
      useFactory: (redis: Redis) => ({
        throttlers: [{ ttl: 60_000, limit: 30 }],
        storage: new RedisThrottlerStorageService(redis),
      }),
    }),
    DatabaseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connectionString: config.getOrThrow<string>('database.url'),
      }),
    }),
    QueueModule,
    EmailModule,
    AuthModule,
    AuditModule,
    UsersModule,
    FilesModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: PrismaClientExceptionFilter },
    { provide: APP_FILTER, useClass: TooManyRequestsExceptionFilter },
  ],
})
export class AppModule {}
