import type { z } from 'zod';
import {
  completeUploadSchema,
  authTokensResponseSchema,
  fileObjectSchema,
  login2faSchema,
  loginOtpStartSchema,
  loginOtpVerifySchema,
  loginPasswordSchema,
  loginPasswordResponseSchema,
  messageResponseSchema,
  paginatedAuditLogsSchema,
  paginatedFilesSchema,
  paginatedUsersSchema,
  passwordResetConfirmSchema,
  passwordResetSessionResponseSchema,
  passwordResetStartSchema,
  passwordResetVerifySchema,
  presignUploadResponseSchema,
  presignUploadSchema,
  refreshTokenResponseSchema,
  registerCompleteSchema,
  registerStartSchema,
  registerVerifyEmailSchema,
  registrationSessionResponseSchema,
  totpConfirmSchema,
  totpSetupResponseSchema,
  totpStatusResponseSchema,
  updateUserSchema,
  userSchema,
  type CompleteUploadInput,
  type AuthTokensResponse,
  type FileObject,
  type Login2faInput,
  type LoginOtpStartInput,
  type LoginOtpVerifyInput,
  type LoginPasswordInput,
  type LoginPasswordResponse,
  type MessageResponse,
  type PaginatedAuditLogs,
  type PaginatedFiles,
  type PaginatedUsers,
  type PasswordResetConfirmInput,
  type PasswordResetSessionResponse,
  type PasswordResetStartInput,
  type PasswordResetVerifyInput,
  type PresignUploadInput,
  type PresignUploadResponse,
  type RefreshTokenResponse,
  type RegisterCompleteInput,
  type RegisterStartInput,
  type RegisterVerifyEmailInput,
  type RegistrationSessionResponse,
  type TotpConfirmInput,
  type TotpSetupResponse,
  type TotpStatusResponse,
  type UpdateUserInput,
  type User,
} from '@repo/backend-types';

export type ApiClientOptions = {
  baseUrl: string;
  fetch?: typeof fetch;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function createApiClient(options: ApiClientOptions) {
  const baseUrl = options.baseUrl.replace(/\/$/, '');
  const fetchFn = options.fetch ?? fetch;
  let refreshPromise: Promise<boolean> | null = null;

  async function request<T>(
    path: string,
    init: RequestInit,
    schema: z.ZodType<T>,
    retry = true,
  ): Promise<T> {
    const response = await fetchFn(`${baseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });

    if (response.status === 401 && retry && path !== '/auth/token/refresh') {
      const refreshed = await refreshOnce();
      if (refreshed) {
        return request(path, init, schema, false);
      }
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    const data = text ? (JSON.parse(text) as unknown) : null;

    if (!response.ok) {
      const message =
        typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        typeof (data as { message: unknown }).message === 'string'
          ? (data as { message: string }).message
          : `Request failed with status ${response.status}`;
      throw new ApiError(response.status, message, data);
    }

    return schema.parse(data);
  }

  async function refreshOnce(): Promise<boolean> {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const res = await fetchFn(`${baseUrl}/auth/token/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          if (!res.ok) {
            return false;
          }
          refreshTokenResponseSchema.parse(await res.json());
          return true;
        } catch {
          return false;
        } finally {
          refreshPromise = null;
        }
      })();
    }

    return refreshPromise;
  }

  return {
    auth: {
      loginWithPassword(
        input: LoginPasswordInput,
      ): Promise<LoginPasswordResponse> {
        return request(
          '/auth/login/password',
          {
            method: 'POST',
            body: JSON.stringify(loginPasswordSchema.parse(input)),
          },
          loginPasswordResponseSchema,
        );
      },

      startOtpLogin(input: LoginOtpStartInput): Promise<MessageResponse> {
        return request(
          '/auth/login/otp/start',
          {
            method: 'POST',
            body: JSON.stringify(loginOtpStartSchema.parse(input)),
          },
          messageResponseSchema,
        );
      },

      verifyOtpLogin(input: LoginOtpVerifyInput): Promise<AuthTokensResponse> {
        return request(
          '/auth/login/otp/verify',
          {
            method: 'POST',
            body: JSON.stringify(loginOtpVerifySchema.parse(input)),
          },
          authTokensResponseSchema,
        );
      },

      loginWith2fa(input: Login2faInput): Promise<AuthTokensResponse> {
        return request(
          '/auth/login/2fa',
          {
            method: 'POST',
            body: JSON.stringify(login2faSchema.parse(input)),
          },
          authTokensResponseSchema,
        );
      },

      registerStart(input: RegisterStartInput): Promise<RegistrationSessionResponse> {
        return request(
          '/auth/register/start',
          {
            method: 'POST',
            body: JSON.stringify(registerStartSchema.parse(input)),
          },
          registrationSessionResponseSchema,
        );
      },

      registerVerifyEmail(
        input: RegisterVerifyEmailInput,
      ): Promise<RegistrationSessionResponse> {
        return request(
          '/auth/register/verify-email',
          {
            method: 'POST',
            body: JSON.stringify(registerVerifyEmailSchema.parse(input)),
          },
          registrationSessionResponseSchema,
        );
      },

      registerComplete(input: RegisterCompleteInput): Promise<AuthTokensResponse> {
        return request(
          '/auth/register/complete',
          {
            method: 'POST',
            body: JSON.stringify(registerCompleteSchema.parse(input)),
          },
          authTokensResponseSchema,
        );
      },

      passwordResetStart(
        input: PasswordResetStartInput,
      ): Promise<PasswordResetSessionResponse> {
        return request(
          '/auth/password-reset/start',
          {
            method: 'POST',
            body: JSON.stringify(passwordResetStartSchema.parse(input)),
          },
          passwordResetSessionResponseSchema,
        );
      },

      passwordResetVerify(
        input: PasswordResetVerifyInput,
      ): Promise<PasswordResetSessionResponse> {
        return request(
          '/auth/password-reset/verify-otp',
          {
            method: 'POST',
            body: JSON.stringify(passwordResetVerifySchema.parse(input)),
          },
          passwordResetSessionResponseSchema,
        );
      },

      passwordResetConfirm(
        input: PasswordResetConfirmInput,
      ): Promise<MessageResponse> {
        return request(
          '/auth/password-reset/confirm',
          {
            method: 'POST',
            body: JSON.stringify(passwordResetConfirmSchema.parse(input)),
          },
          messageResponseSchema,
        );
      },

      refresh(): Promise<RefreshTokenResponse> {
        return request(
          '/auth/token/refresh',
          { method: 'POST', body: JSON.stringify({}) },
          refreshTokenResponseSchema,
          false,
        );
      },

      async logout(): Promise<void> {
        await request(
          '/auth/token/logout',
          { method: 'POST', body: JSON.stringify({}) },
          zVoid,
          false,
        );
      },

      me(): Promise<User> {
        return request('/auth/me', { method: 'GET' }, userSchema);
      },

      totpSetup(): Promise<TotpSetupResponse> {
        return request(
          '/auth/totp/setup',
          { method: 'POST', body: JSON.stringify({}) },
          totpSetupResponseSchema,
        );
      },

      totpConfirm(input: TotpConfirmInput): Promise<TotpStatusResponse> {
        return request(
          '/auth/totp/confirm',
          {
            method: 'POST',
            body: JSON.stringify(totpConfirmSchema.parse(input)),
          },
          totpStatusResponseSchema,
        );
      },

      totpDisable(): Promise<TotpStatusResponse> {
        return request(
          '/auth/totp/disable',
          { method: 'POST', body: JSON.stringify({}) },
          totpStatusResponseSchema,
        );
      },

      getGoogleOAuthUrl(): string {
        return `${baseUrl}/auth/oauth/google`;
      },

      getGitHubOAuthUrl(): string {
        return `${baseUrl}/auth/oauth/github`;
      },
    },

    users: {
      list(params?: {
        page?: number;
        pageSize?: number;
        search?: string;
      }): Promise<PaginatedUsers> {
        const query = new URLSearchParams();
        if (params?.page) query.set('page', String(params.page));
        if (params?.pageSize) query.set('pageSize', String(params.pageSize));
        if (params?.search) query.set('search', params.search);
        const qs = query.toString();
        return request(
          `/users${qs ? `?${qs}` : ''}`,
          { method: 'GET' },
          paginatedUsersSchema,
        );
      },

      getById(id: string): Promise<User> {
        return request(`/users/${id}`, { method: 'GET' }, userSchema);
      },

      update(id: string, input: UpdateUserInput): Promise<User> {
        return request(
          `/users/${id}`,
          {
            method: 'PATCH',
            body: JSON.stringify(updateUserSchema.parse(input)),
          },
          userSchema,
        );
      },

      deactivate(id: string): Promise<User> {
        return request(`/users/${id}`, { method: 'DELETE' }, userSchema);
      },
    },

    audit: {
      list(params?: {
        page?: number;
        pageSize?: number;
        entityType?: string;
      }): Promise<PaginatedAuditLogs> {
        const query = new URLSearchParams();
        if (params?.page) query.set('page', String(params.page));
        if (params?.pageSize) query.set('pageSize', String(params.pageSize));
        if (params?.entityType) query.set('entityType', params.entityType);
        const qs = query.toString();
        return request(
          `/audit-logs${qs ? `?${qs}` : ''}`,
          { method: 'GET' },
          paginatedAuditLogsSchema,
        );
      },
    },

    files: {
      list(params?: {
        page?: number;
        pageSize?: number;
      }): Promise<PaginatedFiles> {
        const query = new URLSearchParams();
        if (params?.page) query.set('page', String(params.page));
        if (params?.pageSize) query.set('pageSize', String(params.pageSize));
        const qs = query.toString();
        return request(
          `/files${qs ? `?${qs}` : ''}`,
          { method: 'GET' },
          paginatedFilesSchema,
        );
      },

      getById(id: string): Promise<FileObject> {
        return request(`/files/${id}`, { method: 'GET' }, fileObjectSchema);
      },

      presignUpload(
        input: PresignUploadInput,
      ): Promise<PresignUploadResponse> {
        return request(
          '/files/presign',
          {
            method: 'POST',
            body: JSON.stringify(presignUploadSchema.parse(input)),
          },
          presignUploadResponseSchema,
        );
      },

      completeUpload(input: CompleteUploadInput): Promise<FileObject> {
        return request(
          '/files/complete',
          {
            method: 'POST',
            body: JSON.stringify(completeUploadSchema.parse(input)),
          },
          fileObjectSchema,
        );
      },
    },
  };
}

/** Accepts empty/204 responses without parsing a body. */
const zVoid = {
  parse: (_data: unknown) => undefined,
} as z.ZodType<void>;

export type ApiClient = ReturnType<typeof createApiClient>;
