'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  passwordResetConfirmSchema,
  passwordResetStartSchema,
  passwordResetVerifySchema,
  type PasswordResetConfirmInput,
  type PasswordResetStartInput,
  type PasswordResetVerifyInput,
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
  Steps,
  toast,
} from '@repo/ui';
import { useState } from 'react';
import { ApiError } from '@repo/api-client';
import { getApiClient } from '@/lib/api';

type Step = 'email' | 'verify' | 'confirm';

const STEPS = ['Email', 'Verify', 'Reset'];
const STEP_INDEX: Record<Step, number> = { email: 0, verify: 1, confirm: 2 };

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [resetId, setResetId] = useState('');

  const startForm = useForm<PasswordResetStartInput>({
    resolver: zodResolver(passwordResetStartSchema),
    defaultValues: { email: '' },
  });

  const verifyForm = useForm<PasswordResetVerifyInput>({
    resolver: zodResolver(passwordResetVerifySchema),
    defaultValues: { resetId: '', code: '' },
  });

  const confirmForm = useForm<PasswordResetConfirmInput>({
    resolver: zodResolver(passwordResetConfirmSchema),
    defaultValues: {
      resetId: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onStart(values: PasswordResetStartInput) {
    try {
      const result = await getApiClient().auth.passwordResetStart(values);
      setResetId(result.resetId);
      verifyForm.setValue('resetId', result.resetId);
      confirmForm.setValue('resetId', result.resetId);
      setStep('verify');
      toast.success('If an account exists, a code was sent');
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to start reset',
      );
    }
  }

  async function onVerify(values: PasswordResetVerifyInput) {
    try {
      await getApiClient().auth.passwordResetVerify(values);
      setStep('confirm');
      toast.success('Code verified');
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Invalid code',
      );
    }
  }

  async function onConfirm(values: PasswordResetConfirmInput) {
    try {
      await getApiClient().auth.passwordResetConfirm(values);
      toast.success('Password updated');
      router.replace('/login');
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to reset password',
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
        <Steps steps={STEPS} currentStep={STEP_INDEX[step]} />
      </div>

      {step === 'email' ? (
        <Form {...startForm}>
          <form onSubmit={startForm.handleSubmit(onStart)} className="space-y-4">
            <FormField
              control={startForm.control}
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
              Send reset code
            </Button>
          </form>
        </Form>
      ) : null}

      {step === 'verify' ? (
        <Form {...verifyForm}>
          <form
            onSubmit={verifyForm.handleSubmit(onVerify)}
            className="space-y-4"
          >
            <FormField
              control={verifyForm.control}
              name="code"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center">
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
              Verify code
            </Button>
          </form>
        </Form>
      ) : null}

      {step === 'confirm' ? (
        <Form {...confirmForm}>
          <form
            onSubmit={confirmForm.handleSubmit(onConfirm)}
            className="space-y-4"
          >
            <FormField
              control={confirmForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={confirmForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <input type="hidden" value={resetId} readOnly />
            <Button type="submit" className="w-full">
              Update password
            </Button>
          </form>
        </Form>
      ) : null}

      <p className="text-center text-sm">
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
