'use client';

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
  toast,
} from '@repo/ui';
import { useState } from 'react';
import { ApiError } from '@repo/api-client';
import { getApiClient } from '@/lib/api';

type Mode = 'password' | 'otp-start' | 'otp-verify';

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
        <p className="text-sm text-muted-foreground">
          Use your password or a one-time email code
        </p>
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
