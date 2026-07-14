'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  loginOtpStartSchema,
  loginOtpVerifySchema,
  loginPasswordSchema,
  type LoginOtpStartInput,
  type LoginOtpVerifyInput,
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
import { useState } from 'react';
import { ApiError } from '@repo/api-client';
import { getApiClient } from '@/lib/api';

type Mode = 'password' | 'otp-start' | 'otp-verify';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

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
  const [otpEmail, setOtpEmail] = useState('');

  const passwordForm = useForm<LoginPasswordInput>({
    resolver: zodResolver(loginPasswordSchema),
    defaultValues: { email: '', password: '' },
  });

  const otpStartForm = useForm<LoginOtpStartInput>({
    resolver: zodResolver(loginOtpStartSchema),
    defaultValues: { email: '' },
  });

  const otpVerifyForm = useForm<LoginOtpVerifyInput>({
    resolver: zodResolver(loginOtpVerifySchema),
    defaultValues: { email: '', code: '' },
  });

  async function onPasswordSubmit(values: LoginPasswordInput) {
    try {
      await getApiClient().auth.loginWithPassword(values);
      toast.success('Signed in');
      router.replace(next);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to sign in',
      );
    }
  }

  async function onOtpStart(values: LoginOtpStartInput) {
    try {
      await getApiClient().auth.startOtpLogin(values);
      setOtpEmail(values.email);
      otpVerifyForm.setValue('email', values.email);
      setMode('otp-verify');
      toast.success('If an account exists, a code was sent');
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to send code',
      );
    }
  }

  async function onOtpVerify(values: LoginOtpVerifyInput) {
    try {
      await getApiClient().auth.verifyOtpLogin(values);
      toast.success('Signed in');
      router.replace(next);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Invalid code',
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      </div>

      <Button type="button" variant="outline" className="w-full" asChild>
        <a href={`${API_BASE_URL}/auth/oauth/google`}>
          <GoogleIcon className="mr-2 size-4" />
          Continue with Google
        </a>
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === 'password' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => setMode('password')}
        >
          Password
        </Button>
        <Button
          type="button"
          variant={mode !== 'password' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => setMode('otp-start')}
        >
          Email code
        </Button>
      </div>

      {mode === 'password' ? (
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
                    <Input type="email" autoComplete="email" {...field} />
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
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </Form>
      ) : null}

      {mode === 'otp-start' ? (
        <Form {...otpStartForm}>
          <form
            onSubmit={otpStartForm.handleSubmit(onOtpStart)}
            className="space-y-4"
          >
            <FormField
              control={otpStartForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Send code
            </Button>
          </form>
        </Form>
      ) : null}

      {mode === 'otp-verify' ? (
        <Form {...otpVerifyForm}>
          <form
            onSubmit={otpVerifyForm.handleSubmit(onOtpVerify)}
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              Enter the code sent to <strong>{otpEmail}</strong>
            </p>
            <FormField
              control={otpVerifyForm.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification code</FormLabel>
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
            <Button type="submit" className="w-full">
              Verify and sign in
            </Button>
          </form>
        </Form>
      ) : null}

      <div className="flex justify-between text-sm">
        <Link href="/register" className="text-primary underline-offset-4 hover:underline">
          Create account
        </Link>
        <Link
          href="/forgot-password"
          className="text-primary underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
      </div>
    </div>
  );
}
