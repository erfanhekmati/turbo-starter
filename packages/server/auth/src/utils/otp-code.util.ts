import { randomInt } from 'node:crypto';
import { OTP_LENGTH } from '../auth.constants';

export function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH;
  return randomInt(0, max).toString().padStart(OTP_LENGTH, '0');
}
