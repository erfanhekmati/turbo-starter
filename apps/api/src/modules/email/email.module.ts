import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { MAIL_TRANSPORTER } from './email.constants';
import { EmailService } from './email.service';
import { createMockTransporter } from './mock-mail.transporter';

@Global()
@Module({
  providers: [
    {
      provide: MAIL_TRANSPORTER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction =
          config.getOrThrow<string>('app.nodeEnv') === 'production';

        if (!isProduction) {
          return createMockTransporter();
        }

        return createTransport({
          host: config.getOrThrow<string>('mail.host'),
          port: config.getOrThrow<number>('mail.port'),
          secure: config.get<boolean>('mail.secure') ?? false,
          auth: {
            user: config.getOrThrow<string>('mail.user'),
            pass: config.getOrThrow<string>('mail.password'),
          },
        });
      },
    },
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule { }
