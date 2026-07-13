import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthModule } from '@repo/auth';
import { EmailModule } from '../email/email.module';
import { LoginController } from './controllers/login.controller';
import { PasswordResetController } from './controllers/password-reset.controller';
import { RegistrationController } from './controllers/registration.controller';
import { TokenController } from './controllers/token.controller';
import { AuthService } from './services/auth.service';
import { LoginLockoutService } from './services/login-lockout.service';
import { OtpService } from './services/otp.service';
import { PasswordHasherService } from './services/password-hasher.service';
import { PasswordResetService } from './services/password-reset.service';
import { RegistrationService } from './services/registration.service';
import { TokenService } from './services/token.service';

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
