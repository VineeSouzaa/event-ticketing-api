import { ConflictException } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { QueryFailedError } from 'typeorm';

import { User } from '../core/entities/user.entity';
import { CredentialsService } from './credentials.service';
import { UsersRepository } from './users.repository';

const user = { id: 'u1', email: 'ana@example.com', name: 'Ana' } as User;

describe('CredentialsService', () => {
  let usersRepository: jest.Mocked<
    Pick<
      UsersRepository,
      'findByEmail' | 'create' | 'findCredentials' | 'updatePasswordHash'
    >
  >;
  let passwordHasher: jest.Mocked<
    Pick<PasswordHasher, 'hash' | 'verify' | 'needsRehash'>
  >;
  let service: CredentialsService;

  beforeEach(() => {
    usersRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findCredentials: jest.fn(),
      updatePasswordHash: jest.fn(),
    };
    passwordHasher = {
      hash: jest.fn().mockResolvedValue('hashed'),
      verify: jest.fn(),
      needsRehash: jest.fn().mockReturnValue(false),
    };
    service = new CredentialsService(
      usersRepository as unknown as UsersRepository,
      passwordHasher as unknown as PasswordHasher,
    );
  });

  describe('register', () => {
    it('stores the hash, never the plaintext password', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue(user);

      await expect(
        service.register(user.email, 'plaintext-password', user.name),
      ).resolves.toBe(user);
      expect(usersRepository.create).toHaveBeenCalledWith(
        user.email,
        user.name,
        'hashed',
      );
    });

    it('rejects an email that is already registered', async () => {
      usersRepository.findByEmail.mockResolvedValue(user);

      await expect(
        service.register(user.email, 'plaintext-password', user.name),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(usersRepository.create).not.toHaveBeenCalled();
    });

    it('turns a unique-index violation from a concurrent sign-up into a 409', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.create.mockRejectedValue(
        new QueryFailedError(
          'INSERT',
          [],
          Object.assign(new Error(), { code: '23505' }),
        ),
      );

      await expect(
        service.register(user.email, 'plaintext-password', user.name),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('does not swallow other database errors', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      const failure = new Error('connection lost');
      usersRepository.create.mockRejectedValue(failure);

      await expect(
        service.register(user.email, 'plaintext-password', user.name),
      ).rejects.toBe(failure);
    });
  });

  describe('verify', () => {
    it('returns the user for a correct password', async () => {
      usersRepository.findCredentials.mockResolvedValue({
        user,
        passwordHash: 'stored',
      });
      passwordHasher.verify.mockResolvedValue(true);

      await expect(service.verify(user.email, 'right')).resolves.toBe(user);
    });

    it('returns null for a wrong password', async () => {
      usersRepository.findCredentials.mockResolvedValue({
        user,
        passwordHash: 'stored',
      });
      passwordHasher.verify.mockResolvedValue(false);

      await expect(service.verify(user.email, 'wrong')).resolves.toBeNull();
    });

    it('still runs the hasher for an unknown email, so timing does not leak it', async () => {
      usersRepository.findCredentials.mockResolvedValue(null);
      passwordHasher.verify.mockResolvedValue(false);

      await expect(
        service.verify('nobody@example.com', 'x'),
      ).resolves.toBeNull();
      expect(passwordHasher.verify).toHaveBeenCalledWith('x', undefined);
    });

    it('returns null for an account without a password', async () => {
      usersRepository.findCredentials.mockResolvedValue({
        user,
        passwordHash: null,
      });
      passwordHasher.verify.mockResolvedValue(true);

      await expect(service.verify(user.email, 'x')).resolves.toBeNull();
    });

    it('upgrades an outdated hash after a successful sign-in', async () => {
      usersRepository.findCredentials.mockResolvedValue({
        user,
        passwordHash: 'old',
      });
      passwordHasher.verify.mockResolvedValue(true);
      passwordHasher.needsRehash.mockReturnValue(true);

      await service.verify(user.email, 'right');

      expect(usersRepository.updatePasswordHash).toHaveBeenCalledWith(
        user.id,
        'hashed',
      );
    });
  });
});
