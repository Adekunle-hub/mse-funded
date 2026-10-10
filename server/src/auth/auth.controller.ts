import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  NotImplementedException,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { SavedService } from '../saved/saved.service.js';
import { SessionService } from '../session/session.service.js';
import { UsersService } from './users.service.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;

function readCredentials(body: unknown, { withName }: { withName: boolean }) {
  const { name, email, password } = (body ?? {}) as Record<string, unknown>;
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
    throw new BadRequestException('Enter an email like name@example.com');
  }
  if (typeof password !== 'string' || (withName && password.length < MIN_PASSWORD_LENGTH)) {
    throw new BadRequestException(`Use at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (withName && (typeof name !== 'string' || !name.trim())) {
    throw new BadRequestException('Enter your full name');
  }
  return { name: typeof name === 'string' ? name.trim() : '', email: email.trim(), password };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly users: UsersService,
    private readonly sessions: SessionService,
    private readonly saved: SavedService,
  ) {}

  @Post('signup')
  async signup(@Body() body: unknown, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const { name, email, password } = readCredentials(body, { withName: true });
    const user = await this.users.create(name, email, password);
    this.startSession(request, response, user.id);
    return { user };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: unknown, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const { email, password } = readCredentials(body, { withName: false });
    const user = await this.users.verify(email, password);
    if (!user) throw new UnauthorizedException("That email and password don't match.");
    this.startSession(request, response, user.id);
    return { user };
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    this.sessions.signOut(this.sessions.ensure(request, response));
  }

  @Get('me')
  me(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const userId = this.sessions.userId(this.sessions.ensure(request, response));
    const user = userId ? this.users.findById(userId) : null;
    if (!user) throw new UnauthorizedException('Not signed in');
    return { user };
  }

  @Get('google')
  google() {
    throw new NotImplementedException('Google sign-in is not configured yet.');
  }

  // Anything saved before signing in moves to the account.
  private startSession(request: Request, response: Response, userId: string) {
    const sessionId = this.sessions.ensure(request, response);
    const guestOwner = this.sessions.ownerKey(sessionId);
    this.sessions.signIn(sessionId, userId);
    this.saved.mergeInto(guestOwner, this.sessions.ownerKey(sessionId));
  }
}
