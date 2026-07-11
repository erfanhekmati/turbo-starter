import type { FactoryProvider, ModuleMetadata } from '@nestjs/common';

export interface DatabaseModuleOptions {
  connectionString: string;
}

/** Async registration options aligned with Nest `FactoryProvider` + `ModuleMetadata.imports`. */
export type DatabaseModuleAsyncOptions = Pick<ModuleMetadata, 'imports'> &
  Pick<FactoryProvider<DatabaseModuleOptions>, 'useFactory' | 'inject'>;
