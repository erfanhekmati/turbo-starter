import { DynamicModule, Module, Provider } from '@nestjs/common';
import {
  DATABASE_MODULE_OPTIONS,
} from './database.constants';
import type {
  DatabaseModuleAsyncOptions,
  DatabaseModuleOptions,
} from './database.module-definition';
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

  static forRootAsync(options: DatabaseModuleAsyncOptions): DynamicModule {
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
