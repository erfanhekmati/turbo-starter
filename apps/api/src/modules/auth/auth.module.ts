import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { QueueModule } from '../queue/queue.module';
import {
  LoginController,
  OAuthController,
  PasswordResetController,
  RegistrationController,
  TokenController,
  TotpController,
} from './controllers';
import {
  GitHubOAuthGuard,
  JwtAccessGuard,
  GoogleOAuthGuard,
  JwtRefreshGuard,
  PermissionsGuard,
  RolesGuard,
} from './guards';
import {
  AuthService,
  CookieService,
  LoginLockoutService,
  OtpService,
  PasswordHasherService,
  PasswordResetService,
  RegistrationService,
  TokenService,
  TotpService,
} from './services';
import {
  GitHubOAuthStrategy,
  GoogleOAuthStrategy,
  JwtAccessStrategy,
  JwtRefreshStrategy,
} from './strategies';

@Module({
  imports: [
    PassportModule,
    QueueModule,
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
    TotpController,
    OAuthController,
  ],
  providers: [
    PasswordHasherService,
    OtpService,
    TotpService,
    LoginLockoutService,
    TokenService,
    CookieService,
    AuthService,
    RegistrationService,
    PasswordResetService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    GoogleOAuthStrategy,
    GitHubOAuthStrategy,
    GoogleOAuthGuard,
    GitHubOAuthGuard,
    JwtRefreshGuard,
    { provide: APP_GUARD, useClass: JwtAccessGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [TokenService, CookieService],
})
export class AuthModule {}
