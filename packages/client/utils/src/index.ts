export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function emptyToUndefined(value: string): string | undefined {
  const t = value.trim();
  return t === '' ? undefined : t;
}
