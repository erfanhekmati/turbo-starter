'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  login2faSchema,
  loginPasswordSchema,
  type Login2faInput,
  type LoginPasswordInput,
} from '@repo/backend-types';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Separator,
  toast,
} from '@repo/ui';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { ApiError } from '@repo/api-client';
import { getApiClient } from '@/lib/api';

type Mode = 'password' | '2fa';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.55-5.17 3.55-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.94-2.92l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.27a12 12 0 0 0 0 10.73l4-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.63l4 3.1C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard';
  const [mode, setMode] = useState<Mode>('password');
  const [mfaToken, setMfaToken] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const passwordForm = useForm<LoginPasswordInput>({
    resolver: zodResolver(loginPasswordSchema),
    defaultValues: { email: '', password: '' },
  });

  const totpForm = useForm<Login2faInput>({
    resolver: zodResolver(login2faSchema),
    defaultValues: { mfaToken: '', code: '' },
  });

  async function onPasswordSubmit(values: LoginPasswordInput) {
    try {
      const result = await getApiClient().auth.loginWithPassword(values);
      if ('requires2fa' in result && result.requires2fa) {
        setMfaToken(result.mfaToken);
        setPendingEmail(values.email);
        totpForm.setValue('mfaToken', result.mfaToken);
        setMode('2fa');
        toast.success('Enter your authenticator code to continue');
        return;
      }

      toast.success('Signed in');
      router.replace(next);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to sign in',
      );
    }
  }

  async function onTotpSubmit(values: Login2faInput) {
    try {
      await getApiClient().auth.loginWith2fa({
        ...values,
        mfaToken,
      });
      toast.success('Signed in');
      router.replace(next);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Invalid authenticator code',
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Admin sign in</h1>
      </div>

      {mode === 'password' ? (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full bg-transparent dark:bg-transparent"
            asChild
          >
            <a href={getApiClient().auth.getGoogleOAuthUrl()}>
              <GoogleIcon className="mr-2 size-4" />
              Continue with Google
            </a>
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Or continue with
            </span>
            <Separator className="flex-1" />
          </div>

          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <FormField
                control={passwordForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                loading={passwordForm.formState.isSubmitting}
              >
                Sign in
              </Button>
            </form>
          </Form>
        </>
      ) : null}

      {mode === '2fa' ? (
        <Form {...totpForm}>
          <form
            onSubmit={totpForm.handleSubmit(onTotpSubmit)}
            className="space-y-4"
          >
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                <ShieldCheck className="size-4" />
                Two-factor authentication
              </div>
              Enter the authenticator code for <strong>{pendingEmail}</strong>.
            </div>
            <FormField
              control={totpForm.control}
              name="code"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center">
                  <FormLabel>Authentication code</FormLabel>
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setMode('password');
                  setMfaToken('');
                  setPendingEmail('');
                  totpForm.reset({ mfaToken: '', code: '' });
                }}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                loading={totpForm.formState.isSubmitting}
              >
                Verify
              </Button>
            </div>
          </form>
        </Form>
      ) : null}
    </div>
  );
}
