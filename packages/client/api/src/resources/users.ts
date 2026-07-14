import {
  paginatedUsersSchema,
  updateUserSchema,
  userSchema,
  type PaginatedUsers,
  type UpdateUserInput,
  type User,
} from '@repo/backend-types';
import type { HttpTransport } from '../types';

export type ListUsersParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type UsersResource = {
  list(params?: ListUsersParams): Promise<PaginatedUsers>;
  getById(id: string): Promise<User>;
  update(id: string, input: UpdateUserInput): Promise<User>;
  deactivate(id: string): Promise<User>;
};

export function createUsersResource(http: HttpTransport): UsersResource {
  const { request } = http;

  return {
    list(params) {
      return request(
        '/users',
        { method: 'GET', params },
        paginatedUsersSchema,
      );
    },

    getById(id) {
      return request(`/users/${id}`, { method: 'GET' }, userSchema);
    },

    update(id, input) {
      return request(
        `/users/${id}`,
        { method: 'PATCH', data: updateUserSchema.parse(input) },
        userSchema,
      );
    },

    deactivate(id) {
      return request(`/users/${id}`, { method: 'DELETE' }, userSchema);
    },
  };
}
