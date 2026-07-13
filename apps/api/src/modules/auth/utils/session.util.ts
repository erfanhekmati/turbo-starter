export function sessionExpiresAt(ttlMinutes: number, from = new Date()): Date {
  return new Date(from.getTime() + ttlMinutes * 60_000);
}

export function isExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt < now;
}
