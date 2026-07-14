import { createApiClient, type ApiClient } from '@repo/api-client';

let client: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (!client) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
    client = createApiClient({ baseUrl });
  }

  return client;
}
