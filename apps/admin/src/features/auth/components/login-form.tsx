'use client';

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
import { Globe, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { ApiError } from '@repo/api-client';
import { getApiClient } from '@/lib/api';

type Mode = 'password' | '2fa';

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
          <div className="grid gap-3">
            <Button asChild variant="outline" className="w-full">
              <a href={getApiClient().auth.getGoogleOAuthUrl()}>
                <Globe className="size-4" />
                Google
              </a>
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              or
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
                <FormItem>
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
