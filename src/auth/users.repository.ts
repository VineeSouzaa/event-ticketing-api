import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../core/entities/user.entity';

const normalize = (email: string) =>
  email.trim().normalize('NFC').toLowerCase();

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async create(
    email: string,
    name: string,
    passwordHash: string | null = null,
  ): Promise<User> {
    return this.users
      .save(
        this.users.create({
          email: normalize(email),
          name,
          passwordHash,
        }),
      )
      .then(({ passwordHash: _hash, ...user }) => user as User);
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOneBy({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOneBy({ email: normalize(email) });
  }

  async findCredentials(
    email: string,
  ): Promise<{ user: User; passwordHash: string | null } | null> {
    const row = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: normalize(email) })
      .getOne();
    if (!row) {
      return null;
    }
    const { passwordHash, ...user } = row;
    return { user: user as User, passwordHash };
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.users.update({ id }, { passwordHash });
  }
}
