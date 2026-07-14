import { HttpClient } from './http/http-client';
import { createResources } from './resources';
import type { ApiClientOptions } from './types';

export function createApiClient(options: ApiClientOptions) {
  const http = new HttpClient(options);
  return createResources(http);
}

export type ApiClient = ReturnType<typeof createApiClient>;
