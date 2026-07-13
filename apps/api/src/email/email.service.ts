import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpPurpose } from '@repo/database';
import type { Transporter } from 'nodemailer';
import { MAIL_TRANSPORTER } from './email.constants';
import { otpEmailHtml, otpEmailSubject } from './templates/otp-email.template';

@Injectable()
export class EmailService {
  private readonly from: string;

  constructor(
    @Inject(MAIL_TRANSPORTER) private readonly transporter: Transporter,
    private readonly config: ConfigService,
  ) {
    this.from = this.config.getOrThrow<string>('mail.from');
  }

  async sendOtpEmail(email: string, code: string, purpose: OtpPurpose): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: otpEmailSubject(purpose),
      html: otpEmailHtml(purpose, code),
    });
  }
}
