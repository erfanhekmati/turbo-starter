import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthModule } from '@repo/auth';
import { EmailModule } from '../email/email.module';
import {
  LoginController,
  PasswordResetController,
  RegistrationController,
  TokenController,
} from './controllers';
import {
  AuthService,
  LoginLockoutService,
  OtpService,
  PasswordHasherService,
  PasswordResetService,
  RegistrationService,
  TokenService,
} from './services';

@Module({
  imports: [
    EmailModule,
    JwtModule.register({}),
    JwtAuthModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        accessSecret: config.getOrThrow<string>('jwt.accessSecret'),
        refreshSecret: config.getOrThrow<string>('jwt.refreshSecret'),
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
  ],
  exports: [TokenService],
})
export class AuthModule {}
