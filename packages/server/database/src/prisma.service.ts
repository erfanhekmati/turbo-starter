import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from './generated/prisma/client';
import {
  DATABASE_MODULE_OPTIONS,
} from './database.constants';
import type { DatabaseModuleOptions } from './database.module-definition';
import { mysqlUrlToPoolConfig } from './mysql-url.util';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly adapter: PrismaMariaDb;

  constructor(
    @Inject(DATABASE_MODULE_OPTIONS)
    private readonly dbOptions: DatabaseModuleOptions,
  ) {
    const adapter = new PrismaMariaDb(
      mysqlUrlToPoolConfig(dbOptions.connectionString),
    );
    super({ adapter });
    this.adapter = adapter;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
