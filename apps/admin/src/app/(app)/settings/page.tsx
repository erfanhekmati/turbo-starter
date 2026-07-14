'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  totpConfirmSchema,
  type TotpConfirmInput,
  type TotpSetupResponse,
} from '@repo/backend-types';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  SettingsCardSkeleton,
  Skeleton,
  toast,
} from '@repo/ui';
import { ApiError } from '@repo/api-client';
import { useCurrentUser } from '@/features/auth';
import { getApiClient } from '@/lib/api';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const [setupData, setSetupData] = useState<TotpSetupResponse | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  const form = useForm<TotpConfirmInput>({
    resolver: zodResolver(totpConfirmSchema),
    defaultValues: { code: '' },
  });

  async function startSetup() {
    setIsSettingUp(true);
    try {
      const data = await getApiClient().auth.totpSetup();
      setSetupData(data);
      toast.success('Scan the QR code and confirm the generated code');
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to start TOTP setup',
      );
    } finally {
      setIsSettingUp(false);
    }
  }

  async function confirmSetup(values: TotpConfirmInput) {
    try {
      await getApiClient().auth.totpConfirm(values);
      setSetupData(null);
      form.reset({ code: '' });
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success('Two-factor authentication enabled');
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to confirm TOTP',
      );
    }
  }

  async function disableTotp() {
    setIsDisabling(true);
    try {
      await getApiClient().auth.totpDisable();
      setSetupData(null);
      form.reset({ code: '' });
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success('Two-factor authentication disabled');
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to disable TOTP',
      );
    } finally {
      setIsDisabling(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account security, including admin TOTP enforcement.
        </p>
      </div>

      {isUserLoading ? (
        <SettingsCardSkeleton />
      ) : (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Two-factor authentication</CardTitle>
            <CardDescription>
              Protect your admin account with an authenticator app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-sm">
              <strong>Status:</strong>{' '}
              {user?.totpEnabled ? 'Enabled' : 'Not enabled'}
            </div>

            {!user?.totpEnabled ? (
              <Button onClick={() => void startSetup()} loading={isSettingUp}>
                Generate setup QR code
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => void disableTotp()}
                loading={isDisabling}
              >
                Disable two-factor authentication
              </Button>
            )}

            {setupData ? (
              <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                <div className="rounded-lg border p-4">
                  <Image
                    src={setupData.qrCodeDataUrl}
                    alt="TOTP QR code"
                    width={180}
                    height={180}
                    unoptimized
                    className="mx-auto"
                  />
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                    <p className="font-medium">Manual setup secret</p>
                    <p className="mt-2 break-all text-muted-foreground">
                      {setupData.secret}
                    </p>
                  </div>

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(confirmSetup)}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Authenticator code</FormLabel>
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
                          onClick={() => setSetupData(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          loading={form.formState.isSubmitting}
                        >
                          Confirm and enable
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
