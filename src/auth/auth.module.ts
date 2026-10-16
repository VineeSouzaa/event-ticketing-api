import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../core/entities/user.entity';
import { AuthController } from './auth.controller';
import { CredentialsService } from './credentials.service';
import { SessionAuth } from './session-auth.provider';
import { UsersRepository } from './users.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
  ],
  controllers: [AuthController],
  providers: [CredentialsService, SessionAuth, UsersRepository],
})
export class AuthModule {}
