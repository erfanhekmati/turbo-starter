import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { OtpPurpose } from '@repo/database';
import { Job } from 'bullmq';
import { EmailService } from '../email/email.service';
import { MAIL_QUEUE, type MailJobData } from './mail.constants';

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<MailJobData>): Promise<void> {
    const data = job.data;
    this.logger.debug(`Processing mail job ${job.name} (${data.type})`);

    switch (data.type) {
      case 'otp':
        await this.emailService.sendOtpEmail(
          data.email,
          data.code,
          data.purpose as OtpPurpose,
        );
        break;
      case 'welcome':
        await this.emailService.sendWelcomeEmail(data.email, data.firstName);
        break;
      case 'password-changed':
        await this.emailService.sendPasswordChangedEmail(data.email);
        break;
      case 'account-locked':
        await this.emailService.sendAccountLockedEmail(
          data.email,
          data.lockoutMinutes,
        );
        break;
      default:
        this.logger.warn(`Unknown mail job: ${JSON.stringify(data)}`);
    }
  }
}
