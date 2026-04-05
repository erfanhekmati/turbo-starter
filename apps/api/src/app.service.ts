import { Injectable } from '@nestjs/common';
import type { JsonValue } from '@repo/types';
import { emptyToUndefined } from '@repo/utils';

@Injectable()
export class AppService {
  getHello(): string {
    return emptyToUndefined('Hello World!') ?? 'Hello World!';
  }

  getHealth(): JsonValue {
    return { status: 'ok' as const };
  }
}
