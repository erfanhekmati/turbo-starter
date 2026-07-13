import type { FactoryProvider, ModuleMetadata } from '@nestjs/common';
import type { JwtAuthModuleOptions } from './types/jwt-auth-module-options.type';

export type JwtAuthModuleAsyncOptions = Pick<ModuleMetadata, 'imports'> &
  Pick<FactoryProvider<JwtAuthModuleOptions>, 'useFactory' | 'inject'>;
