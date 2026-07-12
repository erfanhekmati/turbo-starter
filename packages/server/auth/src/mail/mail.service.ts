import { Injectable } from '@nestjs/common';
import { OtpPurpose } from '@repo/database';
import { MailSender } from './mail-sender';
import { otpEmailHtml, otpEmailSubject } from './templates/otp-email.template';

@Injectable()
export class MailService {
  constructor(private readonly mailSender: MailSender) {}

  async sendOtpEmail(
    email: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    await this.mailSender.send({
      to: email,
      subject: otpEmailSubject(purpose),
      html: otpEmailHtml(purpose, code),
    });
  }
}
