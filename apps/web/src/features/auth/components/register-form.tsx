'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  registerCompleteSchema,
  registerStartSchema,
  registerVerifyEmailSchema,
  type RegisterCompleteInput,
  type RegisterStartInput,
  type RegisterVerifyEmailInput,
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

type Step = 'email' | 'verify' | 'complete';

const STEPS = ['Email', 'Verify', 'Complete'];
const STEP_INDEX: Record<Step, number> = { email: 0, verify: 1, complete: 2 };

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [registrationId, setRegistrationId] = useState('');

  const startForm = useForm<RegisterStartInput>({
    resolver: zodResolver(registerStartSchema),
    defaultValues: { email: '' },
  });

  const verifyForm = useForm<RegisterVerifyEmailInput>({
    resolver: zodResolver(registerVerifyEmailSchema),
    defaultValues: { registrationId: '', code: '' },
  });

  const completeForm = useForm<RegisterCompleteInput>({
    resolver: zodResolver(registerCompleteSchema),
    defaultValues: {
      registrationId: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onStart(values: RegisterStartInput) {
    try {
      const result = await getApiClient().auth.registerStart(values);
      setRegistrationId(result.registrationId);
      verifyForm.setValue('registrationId', result.registrationId);
      completeForm.setValue('registrationId', result.registrationId);
      setStep('verify');
      toast.success('Verification code sent');
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to start registration',
      );
    }
  }

  async function onVerify(values: RegisterVerifyEmailInput) {
    try {
      await getApiClient().auth.registerVerifyEmail(values);
      setStep('complete');
      toast.success('Email verified');
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Invalid verification code',
      );
    }
  }

  async function onComplete(values: RegisterCompleteInput) {
    try {
      await getApiClient().auth.registerComplete(values);
      toast.success('Account created');
      router.replace('/dashboard');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to complete registration',
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
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
              Continue
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
              Verify email
            </Button>
          </form>
        </Form>
      ) : null}

      {step === 'complete' ? (
        <Form {...completeForm}>
          <form
            onSubmit={completeForm.handleSubmit(onComplete)}
            className="space-y-4"
          >
            <FormField
              control={completeForm.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input autoComplete="given-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={completeForm.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input autoComplete="family-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={completeForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
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
              control={completeForm.control}
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
            <input type="hidden" value={registrationId} readOnly />
            <Button type="submit" className="w-full">
              Create account
            </Button>
          </form>
        </Form>
      ) : null}

      <p className="text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
