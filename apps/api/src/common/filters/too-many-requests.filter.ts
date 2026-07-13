import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { TooManyRequestsException } from '../exceptions';

@Catch(TooManyRequestsException)
export class TooManyRequestsExceptionFilter implements ExceptionFilter {
  catch(exception: TooManyRequestsException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse() as {
      message: string;
      retryAfterSeconds: number;
      statusCode: number;
    };

    response
      .status(status)
      .setHeader('Retry-After', String(body.retryAfterSeconds))
      .json(body);
  }
}
