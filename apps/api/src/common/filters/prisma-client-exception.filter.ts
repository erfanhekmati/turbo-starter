import {
  ArgumentsHost,
  Catch,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@repo/database';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    super.catch(this.mapToHttpException(exception), host);
  }

  private mapToHttpException(exception: Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002': {
        const target = (exception.meta?.target as string[] | undefined)?.join(
          ', ',
        );
        return new ConflictException(
          target
            ? `A record with this ${target} already exists`
            : 'A unique constraint violation occurred',
        );
      }
      case 'P2025':
        return new NotFoundException('The requested record was not found');
      default:
        return exception;
    }
  }
}
