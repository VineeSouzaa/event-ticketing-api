import { Injectable } from '@nestjs/common';
import {
  AuthenticationRegistry,
  SessionCookieProvider,
} from '@nestjs/authentication';
import type { SessionRecord } from '@nestjs/authentication';

import { User } from '../core/entities/user.entity';
import { UsersRepository } from './users.repository';

declare module '@nestjs/authentication' {
  interface AuthenticationTypes {
    user: User;
  }
}

@Injectable()
export class SessionAuth extends SessionCookieProvider<User> {
  constructor(
    private readonly users: UsersRepository,
    registry: AuthenticationRegistry,
  ) {
    super();
    registry.registerProvider(this);
  }

  protected validate(session: SessionRecord) {
    return this.users.findById(session.userId);
  }
}
