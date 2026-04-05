import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import {
  DATABASE_MODULE_OPTIONS,
} from './database.constants';
import type { DatabaseModuleOptions } from './database.module-definition';
import { PrismaService } from './prisma.service';

@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseModuleOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: DATABASE_MODULE_OPTIONS,
      useValue: options,
    };
    return {
      module: DatabaseModule,
      global: true,
      providers: [optionsProvider, PrismaService],
      exports: [PrismaService],
    };
  }

  static forRootAsync(options: {
    imports?: Type<unknown>[];
    inject?: (string | symbol | Type<unknown>)[];
    useFactory: (
      ...args: unknown[]
    ) => Promise<DatabaseModuleOptions> | DatabaseModuleOptions;
  }): DynamicModule {
    const optionsProvider: Provider = {
      provide: DATABASE_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };
    return {
      module: DatabaseModule,
      global: true,
      imports: options.imports ?? [],
      providers: [optionsProvider, PrismaService],
      exports: [PrismaService],
    };
  }
}
