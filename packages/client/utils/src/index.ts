/** Sleep for testing, retries, or simple backoff. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Trim and return `undefined` when empty (handy for optional query params). */
export function emptyToUndefined(value: string): string | undefined {
  const t = value.trim();
  return t === '' ? undefined : t;
}
