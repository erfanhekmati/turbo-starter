import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpPurpose } from '@repo/database';
import type { Transporter } from 'nodemailer';
import { MAIL_TRANSPORTER } from './email.constants';
import {
  accountLockedEmailHtml,
  accountLockedEmailSubject,
  otpEmailHtml,
  otpEmailSubject,
  passwordChangedEmailHtml,
  passwordChangedEmailSubject,
  welcomeEmailHtml,
  welcomeEmailSubject,
} from './templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;

  constructor(
    @Inject(MAIL_TRANSPORTER) private readonly transporter: Transporter,
    private readonly config: ConfigService,
  ) {
    this.from = this.config.getOrThrow<string>('mail.from');
  }

  async sendOtpEmail(
    email: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    await this.send({
      to: email,
      subject: otpEmailSubject(purpose),
      html: otpEmailHtml(purpose, code),
    });
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    await this.send({
      to: email,
      subject: welcomeEmailSubject(),
      html: welcomeEmailHtml(firstName),
    });
  }

  async sendPasswordChangedEmail(email: string): Promise<void> {
    await this.send({
      to: email,
      subject: passwordChangedEmailSubject(),
      html: passwordChangedEmailHtml(),
    });
  }

  async sendAccountLockedEmail(
    email: string,
    lockoutMinutes: number,
  ): Promise<void> {
    await this.send({
      to: email,
      subject: accountLockedEmailSubject(),
      html: accountLockedEmailHtml(lockoutMinutes),
    });
  }

  private async send(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        ...options,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${options.subject}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
