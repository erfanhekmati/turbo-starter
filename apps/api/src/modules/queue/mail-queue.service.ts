import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { OtpPurpose } from '@repo/database';
import { Queue } from 'bullmq';
import { MAIL_QUEUE, type MailJobData } from './mail.constants';

@Injectable()
export class MailQueueService {
  constructor(
    @InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue<MailJobData>,
  ) {}

  async enqueueOtp(
    email: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    await this.mailQueue.add(
      'otp',
      { type: 'otp', email, code, purpose },
      { removeOnComplete: 100, removeOnFail: 50, attempts: 3 },
    );
  }

  async enqueueWelcome(email: string, firstName: string): Promise<void> {
    await this.mailQueue.add(
      'welcome',
      { type: 'welcome', email, firstName },
      { removeOnComplete: 100, removeOnFail: 50, attempts: 3 },
    );
  }

  async enqueuePasswordChanged(email: string): Promise<void> {
    await this.mailQueue.add(
      'password-changed',
      { type: 'password-changed', email },
      { removeOnComplete: 100, removeOnFail: 50, attempts: 3 },
    );
  }

  async enqueueAccountLocked(
    email: string,
    lockoutMinutes: number,
  ): Promise<void> {
    await this.mailQueue.add(
      'account-locked',
      { type: 'account-locked', email, lockoutMinutes },
      { removeOnComplete: 100, removeOnFail: 50, attempts: 3 },
    );
  }
}
