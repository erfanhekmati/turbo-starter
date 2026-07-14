import type { z } from 'zod';

export const voidSchema = {
  parse: (_data: unknown) => undefined,
} as z.ZodType<void>;
