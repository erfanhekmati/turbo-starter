import { DynamicModule, Module, Provider } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JWT_AUTH_MODULE_OPTIONS } from './jwt-auth.constants';
import type { JwtAuthModuleAsyncOptions } from './jwt-auth.module-definition';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({})
export class JwtAuthModule {
  static forRootAsync(options: JwtAuthModuleAsyncOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: JWT_AUTH_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };

    return {
      module: JwtAuthModule,
      imports: [...(options.imports ?? []), PassportModule],
      providers: [
        optionsProvider,
        JwtAccessStrategy,
        JwtRefreshStrategy,
        JwtRefreshGuard,
        { provide: APP_GUARD, useClass: JwtAccessGuard },
      ],
      exports: [JwtRefreshGuard],
    };
  }
}
