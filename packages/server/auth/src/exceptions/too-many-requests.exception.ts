import { HttpException, HttpStatus } from '@nestjs/common';

export class TooManyRequestsException extends HttpException {
  constructor(message: string, retryAfterSeconds: number) {
    super(
      { message, retryAfterSeconds, statusCode: HttpStatus.TOO_MANY_REQUESTS },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
