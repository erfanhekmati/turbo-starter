import type { FactoryProvider, ModuleMetadata } from '@nestjs/common';
import type { AuthModuleOptions } from './types/auth-module-options.type';

export type AuthModuleAsyncOptions = Pick<ModuleMetadata, 'imports'> &
  Pick<FactoryProvider<AuthModuleOptions>, 'useFactory' | 'inject'>;
