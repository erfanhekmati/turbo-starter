import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

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
