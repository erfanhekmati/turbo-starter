import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import {
  LoginController,
  PasswordResetController,
  RegistrationController,
  TokenController,
} from './controllers';
import { JwtAccessGuard, JwtRefreshGuard } from './guards';
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
  imports: [JwtModule.register({}), PassportModule],
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
  ],
  exports: [TokenService],
})
export class AuthModule {}
