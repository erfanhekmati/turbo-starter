import { isExpired, sessionExpiresAt } from './session.util';

describe('session.util', () => {
  it('computes expiry from TTL minutes', () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    expect(sessionExpiresAt(30, from).toISOString()).toBe(
      '2026-01-01T00:30:00.000Z',
    );
  });

  it('detects expired timestamps', () => {
    expect(isExpired(new Date(Date.now() - 1000))).toBe(true);
    expect(isExpired(new Date(Date.now() + 60_000))).toBe(false);
  });
});
