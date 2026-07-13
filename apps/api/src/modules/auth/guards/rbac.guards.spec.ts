import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionKey, RoleName } from '@repo/backend-types';
import { IS_PUBLIC_KEY } from '../../../common/decorators';
import { PERMISSIONS_KEY, ROLES_KEY } from '../decorators/roles.decorator';
import { PermissionsGuard } from './permissions.guard';
import { RolesGuard } from './roles.guard';
import type { AuthenticatedUser } from '../types';

function createContext(user?: AuthenticatedUser): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows public routes without checking roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) {
        return true;
      }

      return [RoleName.ADMIN];
    });

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows routes without role metadata', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(
      guard.canActivate(
        createContext({
          id: 'user-1',
          email: 'user@example.com',
          roles: [RoleName.USER],
          permissions: [],
        }),
      ),
    ).toBe(true);
  });

  it('allows when the user has at least one required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === ROLES_KEY) {
        return [RoleName.ADMIN, RoleName.USER];
      }

      return undefined;
    });

    expect(
      guard.canActivate(
        createContext({
          id: 'user-1',
          email: 'user@example.com',
          roles: [RoleName.USER],
          permissions: [],
        }),
      ),
    ).toBe(true);
  });

  it('throws ForbiddenException when the user lacks required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === ROLES_KEY) {
        return [RoleName.ADMIN];
      }

      return undefined;
    });

    expect(() =>
      guard.canActivate(
        createContext({
          id: 'user-1',
          email: 'user@example.com',
          roles: [RoleName.USER],
          permissions: [],
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});

describe('PermissionsGuard', () => {
  let reflector: Reflector;
  let guard: PermissionsGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  it('allows public routes without checking permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) {
        return true;
      }

      return [PermissionKey.USERS_WRITE];
    });

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows routes without permission metadata', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(
      guard.canActivate(
        createContext({
          id: 'user-1',
          email: 'user@example.com',
          roles: [],
          permissions: [PermissionKey.USERS_READ],
        }),
      ),
    ).toBe(true);
  });

  it('allows when the user has all required permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === PERMISSIONS_KEY) {
        return [PermissionKey.USERS_READ, PermissionKey.USERS_WRITE];
      }

      return undefined;
    });

    expect(
      guard.canActivate(
        createContext({
          id: 'user-1',
          email: 'user@example.com',
          roles: [],
          permissions: [
            PermissionKey.USERS_READ,
            PermissionKey.USERS_WRITE,
            PermissionKey.ROLES_MANAGE,
          ],
        }),
      ),
    ).toBe(true);
  });

  it('throws ForbiddenException when the user lacks a required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === PERMISSIONS_KEY) {
        return [PermissionKey.USERS_READ, PermissionKey.USERS_WRITE];
      }

      return undefined;
    });

    expect(() =>
      guard.canActivate(
        createContext({
          id: 'user-1',
          email: 'user@example.com',
          roles: [],
          permissions: [PermissionKey.USERS_READ],
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
