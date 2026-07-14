import { OtpPurpose } from '@repo/database';

const SUBJECT_BY_PURPOSE: Record<OtpPurpose, string> = {
  [OtpPurpose.REGISTRATION_EMAIL_VERIFICATION]: 'Verify your email address',
  [OtpPurpose.LOGIN]: 'Your login verification code',
  [OtpPurpose.PASSWORD_RESET]: 'Reset your password',
};

const INTRO_BY_PURPOSE: Record<OtpPurpose, string> = {
  [OtpPurpose.REGISTRATION_EMAIL_VERIFICATION]:
    'Use the code below to verify your email address.',
  [OtpPurpose.LOGIN]: 'Use the code below to finish signing in.',
  [OtpPurpose.PASSWORD_RESET]: 'Use the code below to reset your password.',
};

export function otpEmailSubject(purpose: OtpPurpose): string {
  return SUBJECT_BY_PURPOSE[purpose];
}

export function otpEmailHtml(purpose: OtpPurpose, code: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p>${INTRO_BY_PURPOSE[purpose]}</p>
      <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center;">${code}</p>
      <p>This code expires shortly and can only be used once. If you didn't request it, you can ignore this email.</p>
    </div>
  `;
}
