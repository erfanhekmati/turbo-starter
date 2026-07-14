import type { FactoryProvider, ModuleMetadata } from '@nestjs/common';

export interface DatabaseModuleOptions {
  connectionString: string;
}

export type DatabaseModuleAsyncOptions = Pick<ModuleMetadata, 'imports'> &
  Pick<FactoryProvider<DatabaseModuleOptions>, 'useFactory' | 'inject'>;
