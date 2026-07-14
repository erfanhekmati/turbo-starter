import { Logger } from '@nestjs/common';
import type { SentMessageInfo, Transporter } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';

export function createMockTransporter(): Transporter {
  const logger = new Logger('MockMailTransporter');

  return {
    sendMail: (options: Mail.Options): Promise<SentMessageInfo> => {
      logger.log(
        `Mock email (not sent) -> to: ${options.to}, subject: ${options.subject}\n${options.html}`,
      );
      return Promise.resolve({ messageId: 'mock', envelope: {} });
    },
  } as unknown as Transporter;
}
