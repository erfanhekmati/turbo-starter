'use client';

import { useQuery } from '@tanstack/react-query';
import type { User } from '@repo/backend-types';
import { getApiClient } from '@/lib/api';

export function useCurrentUser(enabled = true) {
  return useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: () => getApiClient().auth.me(),
    enabled,
    retry: false,
  });
}
