import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  emailVerifiedAt: z.union([z.string(), z.date()]),
  createdAt: z.union([z.string(), z.date()]),
  isActive: z.boolean().optional().default(true),
  totpEnabled: z.boolean().optional().default(false),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
});

export const authTokensResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: userSchema,
});

export const refreshTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const messageResponseSchema = z.object({
  message: z.string(),
});

export const registrationSessionResponseSchema = z.object({
  registrationId: z.string().uuid(),
});

export const passwordResetSessionResponseSchema = z.object({
  resetId: z.string().uuid(),
});

export const loginPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const loginRequires2faResponseSchema = z.object({
  requires2fa: z.literal(true),
  mfaToken: z.string(),
});

export const loginPasswordResponseSchema = z.union([
  authTokensResponseSchema,
  loginRequires2faResponseSchema,
]);

export const loginOtpStartSchema = z.object({
  email: z.string().email(),
});

export const loginOtpVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(12),
});

export const login2faSchema = z.object({
  mfaToken: z.string().min(1),
  code: z.string().trim().min(6).max(8),
});

export const totpSetupResponseSchema = z.object({
  secret: z.string(),
  otpauthUrl: z.string(),
  qrCodeDataUrl: z.string(),
});

export const totpConfirmSchema = z.object({
  code: z.string().trim().min(6).max(8),
});

export const totpStatusResponseSchema = z.object({
  totpEnabled: z.boolean(),
  message: z.string(),
});

export const registerStartSchema = z.object({
  email: z.string().email(),
});

export const registerVerifyEmailSchema = z.object({
  registrationId: z.string().uuid(),
  code: z.string().min(4).max(12),
});

export const registerCompleteSchema = z
  .object({
    registrationId: z.string().uuid(),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'confirmPassword must match password',
    path: ['confirmPassword'],
  });

export const passwordResetStartSchema = z.object({
  email: z.string().email(),
});

export const passwordResetVerifySchema = z.object({
  resetId: z.string().uuid(),
  code: z.string().min(4).max(12),
});

export const passwordResetConfirmSchema = z
  .object({
    resetId: z.string().uuid(),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'confirmPassword must match password',
    path: ['confirmPassword'],
  });

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;
export type AuthTokensResponse = z.infer<typeof authTokensResponseSchema>;
export type RefreshTokenResponse = z.infer<typeof refreshTokenResponseSchema>;
export type MessageResponse = z.infer<typeof messageResponseSchema>;
export type RegistrationSessionResponse = z.infer<
  typeof registrationSessionResponseSchema
>;
export type PasswordResetSessionResponse = z.infer<
  typeof passwordResetSessionResponseSchema
>;
export type LoginPasswordInput = z.infer<typeof loginPasswordSchema>;
export type LoginRequires2faResponse = z.infer<
  typeof loginRequires2faResponseSchema
>;
export type LoginPasswordResponse = z.infer<
  typeof loginPasswordResponseSchema
>;
export type LoginOtpStartInput = z.infer<typeof loginOtpStartSchema>;
export type LoginOtpVerifyInput = z.infer<typeof loginOtpVerifySchema>;
export type Login2faInput = z.infer<typeof login2faSchema>;
export type TotpSetupResponse = z.infer<typeof totpSetupResponseSchema>;
export type TotpConfirmInput = z.infer<typeof totpConfirmSchema>;
export type TotpStatusResponse = z.infer<typeof totpStatusResponseSchema>;
export type RegisterStartInput = z.infer<typeof registerStartSchema>;
export type RegisterVerifyEmailInput = z.infer<typeof registerVerifyEmailSchema>;
export type RegisterCompleteInput = z.infer<typeof registerCompleteSchema>;
export type PasswordResetStartInput = z.infer<typeof passwordResetStartSchema>;
export type PasswordResetVerifyInput = z.infer<typeof passwordResetVerifySchema>;
export type PasswordResetConfirmInput = z.infer<
  typeof passwordResetConfirmSchema
>;
