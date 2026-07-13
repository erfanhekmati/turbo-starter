import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto';

function hmac(value: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(value).digest();
}

export function hashOtp(code: string, secret: string): string {
  return hmac(code, secret).toString('hex');
}

export function verifyOtp(code: string, hash: string, secret: string): boolean {
  const expected = hmac(code, secret);
  const actual = Buffer.from(hash, 'hex');
  if (expected.length !== actual.length) {
    return false;
  }
  return timingSafeEqual(expected, actual);
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateOtpCode(length: number): string {
  const max = 10 ** length;
  return randomInt(0, max).toString().padStart(length, '0');
}
