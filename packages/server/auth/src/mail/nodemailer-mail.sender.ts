import { Inject, Injectable } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { AUTH_MODULE_OPTIONS } from '../auth.constants';
import type { AuthModuleOptions } from '../types/auth-module-options.type';
import { MailMessage, MailSender } from './mail-sender';

@Injectable()
export class NodemailerMailSender extends MailSender {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(
    @Inject(AUTH_MODULE_OPTIONS) private readonly options: AuthModuleOptions,
  ) {
    super();
    this.transporter = createTransport({
      host: options.mail.host,
      port: options.mail.port,
      secure: options.mail.secure ?? false,
      auth: {
        user: options.mail.user,
        pass: options.mail.password,
      },
    });
    this.from = options.mail.from;
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
    });
  }
}
