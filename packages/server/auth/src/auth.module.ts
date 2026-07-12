import { DynamicModule, Module, Provider } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AUTH_MODULE_OPTIONS } from './auth.constants';
import type { AuthModuleAsyncOptions } from './auth.module-definition';
import { LoginController } from './controllers/login.controller';
import { PasswordResetController } from './controllers/password-reset.controller';
import { RegistrationController } from './controllers/registration.controller';
import { TokenController } from './controllers/token.controller';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { MailSender } from './mail/mail-sender';
import { MailService } from './mail/mail.service';
import { NodemailerMailSender } from './mail/nodemailer-mail.sender';
import { AuthService } from './services/auth.service';
import { LoginLockoutService } from './services/login-lockout.service';
import { OtpService } from './services/otp.service';
import { PasswordHasherService } from './services/password-hasher.service';
import { PasswordResetService } from './services/password-reset.service';
import { RegistrationService } from './services/registration.service';
import { TokenService } from './services/token.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';

@Module({})
export class AuthModule {
  static forRootAsync(options: AuthModuleAsyncOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: AUTH_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };

    return {
      module: AuthModule,
      imports: [
        ...(options.imports ?? []),
        PassportModule,
        JwtModule.register({}),
      ],
      controllers: [
        RegistrationController,
        LoginController,
        PasswordResetController,
        TokenController,
      ],
      providers: [
        optionsProvider,
        { provide: MailSender, useClass: NodemailerMailSender },
        MailService,
        PasswordHasherService,
        OtpService,
        LoginLockoutService,
        TokenService,
        AuthService,
        RegistrationService,
        PasswordResetService,
        JwtAccessStrategy,
        { provide: APP_GUARD, useClass: JwtAccessGuard },
      ],
      exports: [TokenService],
    };
  }
}
