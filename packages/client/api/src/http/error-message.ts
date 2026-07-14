export function extractErrorMessage(
  data: unknown,
  status: number,
): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof (data as { message: unknown }).message === 'string'
  ) {
    return (data as { message: string }).message;
  }

  return `Request failed with status ${status}`;
}
