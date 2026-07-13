import { randomInt } from 'node:crypto';

export function generateOtpCode(length: number): string {
  const max = 10 ** length;
  return randomInt(0, max).toString().padStart(length, '0');
}
