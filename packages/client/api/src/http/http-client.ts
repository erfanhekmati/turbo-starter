import axios, { type AxiosInstance, isAxiosError } from 'axios';
import type { z } from 'zod';
import { refreshTokenResponseSchema } from '@repo/backend-types';
import { ApiError } from '../errors';
import type {
  ApiClientOptions,
  HttpTransport,
  RequestConfig,
  RequestFn,
} from '../types';
import { extractErrorMessage } from './error-message';

const REFRESH_PATH = '/auth/token/refresh';

export class HttpClient implements HttpTransport {
  readonly baseUrl: string;

  private readonly axios: AxiosInstance;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.axios =
      options.axios ??
      axios.create({
        baseURL: this.baseUrl,
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
  }

  readonly request: RequestFn = async <T>(
    path: string,
    config: RequestConfig,
    schema: z.ZodType<T>,
    retry = true,
  ): Promise<T> => {
    try {
      const response = await this.axios.request({
        url: path,
        ...config,
      });

      if (response.status === 204) {
        return undefined as T;
      }

      return schema.parse(response.data);
    } catch (error) {
      if (!isAxiosError(error) || error.response === undefined) {
        throw error;
      }

      const { status, data } = error.response;

      if (status === 401 && retry && path !== REFRESH_PATH) {
        const refreshed = await this.refreshOnce();
        if (refreshed) {
          return this.request(path, config, schema, false);
        }
      }

      throw new ApiError(status, extractErrorMessage(data, status), data);
    }
  };

  private async refreshOnce(): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.performRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }

    return this.refreshPromise;
  }

  private async performRefresh(): Promise<boolean> {
    try {
      const response = await this.axios.post(REFRESH_PATH, {});
      refreshTokenResponseSchema.parse(response.data);
      return true;
    } catch {
      return false;
    }
  }
}
