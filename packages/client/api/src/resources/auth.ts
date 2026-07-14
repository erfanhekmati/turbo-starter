import {
  authTokensResponseSchema,
  login2faSchema,
  loginOtpStartSchema,
  loginOtpVerifySchema,
  loginPasswordResponseSchema,
  loginPasswordSchema,
  messageResponseSchema,
  passwordResetConfirmSchema,
  passwordResetSessionResponseSchema,
  passwordResetStartSchema,
  passwordResetVerifySchema,
  refreshTokenResponseSchema,
  registerCompleteSchema,
  registerStartSchema,
  registerVerifyEmailSchema,
  registrationSessionResponseSchema,
  totpConfirmSchema,
  totpSetupResponseSchema,
  totpStatusResponseSchema,
  userSchema,
  type AuthTokensResponse,
  type Login2faInput,
  type LoginOtpStartInput,
  type LoginOtpVerifyInput,
  type LoginPasswordInput,
  type LoginPasswordResponse,
  type MessageResponse,
  type PasswordResetConfirmInput,
  type PasswordResetSessionResponse,
  type PasswordResetStartInput,
  type PasswordResetVerifyInput,
  type RefreshTokenResponse,
  type RegisterCompleteInput,
  type RegisterStartInput,
  type RegisterVerifyEmailInput,
  type RegistrationSessionResponse,
  type TotpConfirmInput,
  type TotpSetupResponse,
  type TotpStatusResponse,
  type User,
} from '@repo/backend-types';
import { voidSchema } from '../http/void-schema';
import type { HttpTransport } from '../types';

export type AuthResource = {
  loginWithPassword(input: LoginPasswordInput): Promise<LoginPasswordResponse>;
  startOtpLogin(input: LoginOtpStartInput): Promise<MessageResponse>;
  verifyOtpLogin(input: LoginOtpVerifyInput): Promise<AuthTokensResponse>;
  loginWith2fa(input: Login2faInput): Promise<AuthTokensResponse>;
  registerStart(input: RegisterStartInput): Promise<RegistrationSessionResponse>;
  registerVerifyEmail(
    input: RegisterVerifyEmailInput,
  ): Promise<RegistrationSessionResponse>;
  registerComplete(input: RegisterCompleteInput): Promise<AuthTokensResponse>;
  passwordResetStart(
    input: PasswordResetStartInput,
  ): Promise<PasswordResetSessionResponse>;
  passwordResetVerify(
    input: PasswordResetVerifyInput,
  ): Promise<PasswordResetSessionResponse>;
  passwordResetConfirm(
    input: PasswordResetConfirmInput,
  ): Promise<MessageResponse>;
  refresh(): Promise<RefreshTokenResponse>;
  logout(): Promise<void>;
  me(): Promise<User>;
  totpSetup(): Promise<TotpSetupResponse>;
  totpConfirm(input: TotpConfirmInput): Promise<TotpStatusResponse>;
  totpDisable(): Promise<TotpStatusResponse>;
  getGoogleOAuthUrl(): string;
};

export function createAuthResource(http: HttpTransport): AuthResource {
  const { request, baseUrl } = http;

  return {
    loginWithPassword(input) {
      return request(
        '/auth/login/password',
        { method: 'POST', data: loginPasswordSchema.parse(input) },
        loginPasswordResponseSchema,
      );
    },

    startOtpLogin(input) {
      return request(
        '/auth/login/otp/start',
        { method: 'POST', data: loginOtpStartSchema.parse(input) },
        messageResponseSchema,
      );
    },

    verifyOtpLogin(input) {
      return request(
        '/auth/login/otp/verify',
        { method: 'POST', data: loginOtpVerifySchema.parse(input) },
        authTokensResponseSchema,
      );
    },

    loginWith2fa(input) {
      return request(
        '/auth/login/2fa',
        { method: 'POST', data: login2faSchema.parse(input) },
        authTokensResponseSchema,
      );
    },

    registerStart(input) {
      return request(
        '/auth/register/start',
        { method: 'POST', data: registerStartSchema.parse(input) },
        registrationSessionResponseSchema,
      );
    },

    registerVerifyEmail(input) {
      return request(
        '/auth/register/verify-email',
        { method: 'POST', data: registerVerifyEmailSchema.parse(input) },
        registrationSessionResponseSchema,
      );
    },

    registerComplete(input) {
      return request(
        '/auth/register/complete',
        { method: 'POST', data: registerCompleteSchema.parse(input) },
        authTokensResponseSchema,
      );
    },

    passwordResetStart(input) {
      return request(
        '/auth/password-reset/start',
        { method: 'POST', data: passwordResetStartSchema.parse(input) },
        passwordResetSessionResponseSchema,
      );
    },

    passwordResetVerify(input) {
      return request(
        '/auth/password-reset/verify-otp',
        { method: 'POST', data: passwordResetVerifySchema.parse(input) },
        passwordResetSessionResponseSchema,
      );
    },

    passwordResetConfirm(input) {
      return request(
        '/auth/password-reset/confirm',
        { method: 'POST', data: passwordResetConfirmSchema.parse(input) },
        messageResponseSchema,
      );
    },

    refresh() {
      return request(
        '/auth/token/refresh',
        { method: 'POST', data: {} },
        refreshTokenResponseSchema,
        false,
      );
    },

    async logout() {
      await request(
        '/auth/token/logout',
        { method: 'POST', data: {} },
        voidSchema,
        false,
      );
    },

    me() {
      return request('/auth/me', { method: 'GET' }, userSchema);
    },

    totpSetup() {
      return request(
        '/auth/totp/setup',
        { method: 'POST', data: {} },
        totpSetupResponseSchema,
      );
    },

    totpConfirm(input) {
      return request(
        '/auth/totp/confirm',
        { method: 'POST', data: totpConfirmSchema.parse(input) },
        totpStatusResponseSchema,
      );
    },

    totpDisable() {
      return request(
        '/auth/totp/disable',
        { method: 'POST', data: {} },
        totpStatusResponseSchema,
      );
    },

    getGoogleOAuthUrl() {
      return `${baseUrl}/auth/oauth/google`;
    },
  };
}
