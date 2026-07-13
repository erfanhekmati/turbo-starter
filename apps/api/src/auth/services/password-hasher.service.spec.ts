import { PasswordHasherService } from './password-hasher.service';

describe('PasswordHasherService', () => {
  const service = new PasswordHasherService();

  it('hashes a password and verifies it against the same plain text', async () => {
    const hash = await service.hash('correct horse battery staple');
    await expect(service.verify(hash, 'correct horse battery staple')).resolves.toBe(true);
  });

  it('rejects verification against a different plain text', async () => {
    const hash = await service.hash('correct horse battery staple');
    await expect(service.verify(hash, 'wrong password')).resolves.toBe(false);
  });

  it('produces a different hash for the same input on each call (salted)', async () => {
    const [first, second] = await Promise.all([
      service.hash('same-input'),
      service.hash('same-input'),
    ]);
    expect(first).not.toEqual(second);
  });
});
