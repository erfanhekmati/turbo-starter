import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { z } from 'zod';

export type ApiClientOptions = {
  baseUrl: string;
  axios?: AxiosInstance;
};

export type RequestConfig = Pick<
  AxiosRequestConfig,
  'method' | 'data' | 'headers' | 'params'
>;

export type RequestFn = <T>(
  path: string,
  config: RequestConfig,
  schema: z.ZodType<T>,
  retry?: boolean,
) => Promise<T>;

export type HttpTransport = {
  request: RequestFn;
  readonly baseUrl: string;
};
