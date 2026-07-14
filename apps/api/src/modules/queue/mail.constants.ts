export const MAIL_QUEUE = 'mail';

export type MailJobName =
  | 'otp'
  | 'welcome'
  | 'password-changed'
  | 'account-locked';

export type OtpMailJob = {
  type: 'otp';
  email: string;
  code: string;
  purpose: string;
};

export type WelcomeMailJob = {
  type: 'welcome';
  email: string;
  firstName: string;
};

export type PasswordChangedMailJob = {
  type: 'password-changed';
  email: string;
};

export type AccountLockedMailJob = {
  type: 'account-locked';
  email: string;
  lockoutMinutes: number;
};

export type MailJobData =
  | OtpMailJob
  | WelcomeMailJob
  | PasswordChangedMailJob
  | AccountLockedMailJob;
