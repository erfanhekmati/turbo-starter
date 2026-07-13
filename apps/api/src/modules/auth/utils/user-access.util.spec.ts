import { flattenUserAccess } from './user-access.util';

describe('flattenUserAccess', () => {
  it('deduplicates role names and permission keys', () => {
    const profile = flattenUserAccess({
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      roles: [
        {
          role: {
            name: 'USER',
            permissions: [
              { permission: { key: 'users:read' } },
              { permission: { key: 'users:read' } },
            ],
          },
        },
        {
          role: {
            name: 'ADMIN',
            permissions: [
              { permission: { key: 'users:write' } },
              { permission: { key: 'roles:manage' } },
            ],
          },
        },
      ],
    });

    expect(profile.roles).toEqual(['USER', 'ADMIN']);
    expect(profile.permissions).toEqual([
      'users:read',
      'users:write',
      'roles:manage',
    ]);
  });
});
