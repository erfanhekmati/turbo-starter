import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import {
  LoginController,
  PasswordResetController,
  RegistrationController,
  TokenController,
} from './controllers';
import {
  JwtAccessGuard,
  JwtRefreshGuard,
  PermissionsGuard,
  RolesGuard,
} from './guards';
import {
  AuthService,
  LoginLockoutService,
  OtpService,
  PasswordHasherService,
  PasswordResetService,
  RegistrationService,
  TokenService,
} from './services';
import { JwtAccessStrategy, JwtRefreshStrategy } from './strategies';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('jwt.accessSecret'),
      }),
    }),
  ],
  controllers: [
    RegistrationController,
    LoginController,
    PasswordResetController,
    TokenController,
  ],
  providers: [
    PasswordHasherService,
    OtpService,
    LoginLockoutService,
    TokenService,
    AuthService,
    RegistrationService,
    PasswordResetService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    JwtRefreshGuard,
    { provide: APP_GUARD, useClass: JwtAccessGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [TokenService],
})
export class AuthModule {}
