import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'node:path';
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
    DatabaseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connectionString: config.getOrThrow<string>('DATABASE_URL'),
      }),
    }),
  ],
  providers: [],
})
export class AppModule {}
