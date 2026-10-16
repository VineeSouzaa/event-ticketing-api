import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiOkResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser, Public, SignInService } from '@nestjs/authentication';

import { User } from '../core/entities/user.entity';
import { SignInDto, SignUpDto, UserResponseDto } from './dto/auth.dto';
import { CredentialsService } from './credentials.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly credentialsService: CredentialsService,
    private readonly signInService: SignInService,
  ) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('sign-up')
  @ApiOkResponse({ type: UserResponseDto })
  @ApiConflictResponse({ description: 'Email already registered' })
  async signUp(@Body() body: SignUpDto): Promise<User> {
    const user = await this.credentialsService.register(
      body.email,
      body.password,
      body.name,
    );
    await this.signInService.signIn(user.id, { method: 'password' });
    return user;
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('sign-in')
  @HttpCode(200)
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  @ApiTooManyRequestsResponse({ description: 'Too many attempts' })
  async signIn(@Body() body: SignInDto): Promise<User> {
    const user = await this.credentialsService.verify(
      body.email,
      body.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    await this.signInService.signIn(user.id, { method: 'password' });
    return user;
  }

  @Post('sign-out')
  @HttpCode(204)
  @ApiCookieAuth()
  async signOut(): Promise<void> {
    await this.signInService.signOut();
  }

  @Get('me')
  @ApiCookieAuth()
  @ApiOkResponse({ type: UserResponseDto })
  me(@CurrentUser() user: User): User {
    return user;
  }
}
