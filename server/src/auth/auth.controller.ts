import { randomBytes } from 'node:crypto';

import { Body, Controller, Get, HttpCode, Post, Query, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';

import type { Env } from '../config/env.js';
import { UsersService } from '../users/users.service.js';
import { ACCESS_COOKIE, AuthGuard } from './auth.guard.js';
import { AuthService, type AuthTokens } from './auth.service.js';
import { CurrentUserId } from './current-user-id.decorator.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { GoogleAuthService } from './google-auth.service.js';
import { apiUrl } from '../config/urls.js';

const REFRESH_COOKIE = 'refresh_token';
const GOOGLE_COOKIE = 'google_sign_in';

type GoogleSignIn = { state: string; next: string | null; save: string | null };

function safePath(value: unknown): string | null {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value.slice(0, 500) : null;
}

function readGoogleCookie(value: unknown): GoogleSignIn | null {
  if (typeof value !== 'string') return null;
  try {
    const parsed = JSON.parse(value) as Partial<GoogleSignIn>;
    return typeof parsed.state === 'string'
      ? { state: parsed.state, next: safePath(parsed.next), save: typeof parsed.save === 'string' ? parsed.save : null }
      : null;
  } catch {
    return null;
  }
}
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const authAttemptLimit = { default: { limit: 10, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  private readonly accessCookie: CookieOptions;
  private readonly refreshCookie: CookieOptions;
  private readonly googleCookie: CookieOptions;
  private readonly siteUrl: string;

  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly google: GoogleAuthService,
    config: ConfigService<Env, true>,
  ) {
    this.siteUrl = config.get('CLIENT_ORIGIN', { infer: true })[0];
    const isProd = config.get('NODE_ENV', { infer: true }) === 'production';
    const prefix = new URL(apiUrl(config)).pathname.replace(/\/$/, '');
    const base: CookieOptions = {
      httpOnly: true,
      sameSite:'lax',
      secure:isProd,
    };
    this.accessCookie = {
      ...base,
      path: '/',
      maxAge: config.get('ACCESS_TOKEN_TTL_MINUTES', { infer: true }) * MINUTE_MS,
    };
    this.refreshCookie = {
      ...base,
      path: `${prefix}/auth`,
      maxAge: config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true }) * DAY_MS,
    };
    this.googleCookie = { ...base, path: `${prefix}/auth/google`, maxAge: 10 * MINUTE_MS };
  }

  @Get('google')
  startGoogle(@Query('next') next: unknown, @Query('save') save: unknown, @Res() response: Response) {
    if (!this.google.enabled) return response.redirect(`${this.siteUrl}/login?error=google`);

    const signIn: GoogleSignIn = {
      state: randomBytes(16).toString('base64url'),
      next: safePath(next),
      save: typeof save === 'string' ? save.slice(0, 200) : null,
    };
    response.cookie(GOOGLE_COOKIE, JSON.stringify(signIn), this.googleCookie);
    return response.redirect(this.google.authUrl(signIn.state));
  }

  @Get('google/callback')
  async finishGoogle(
    @Query('code') code: unknown,
    @Query('state') state: unknown,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const signIn = readGoogleCookie(request.cookies?.[GOOGLE_COOKIE]);
    const { maxAge: _maxAge, ...googleOptions } = this.googleCookie;
    response.clearCookie(GOOGLE_COOKIE, googleOptions);

    if (!signIn || typeof code !== 'string' || state !== signIn.state) {
      return response.redirect(`${this.siteUrl}/login?error=google`);
    }

    try {
      const user = await this.users.findOrCreateFromGoogle(await this.google.profile(code));
      this.setCookies(response, await this.auth.issueTokens(user.id));
    } catch {
      return response.redirect(`${this.siteUrl}/login?error=google`);
    }

    const params = new URLSearchParams();
    if (signIn.next) params.set('next', signIn.next);
    if (signIn.save) params.set('save', signIn.save);
    const query = params.toString();
    return response.redirect(`${this.siteUrl}/signed-in${query ? `?${query}` : ''}`);
  }

  @Throttle(authAttemptLimit)
  @Post('signup')
  async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) response: Response) {
    const user = await this.auth.signup(dto);
    this.setCookies(response, await this.auth.issueTokens(user.id));
    return { user };
  }

  @Throttle(authAttemptLimit)
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const user = await this.auth.login(dto);
    this.setCookies(response, await this.auth.issueTokens(user.id));
    return { user };
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(204)
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!refreshToken) throw new UnauthorizedException('Please log in');

    try {
      this.setCookies(response, await this.auth.refresh(refreshToken));
    } catch (error) {
      this.clearCookies(response);
      throw error;
    }
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(204)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.requestPasswordReset(dto);
  }

  @Throttle(authAttemptLimit)
  @Post('reset-password')
  @HttpCode(204)
  async resetPassword(@Body() dto: ResetPasswordDto, @Res({ passthrough: true }) response: Response) {
    await this.auth.resetPassword(dto);
    this.clearCookies(response);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (refreshToken) await this.auth.revoke(refreshToken);
    this.clearCookies(response);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@CurrentUserId() userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException('Please log in');
    return { user };
  }

  private setCookies(response: Response, { accessToken, refreshToken }: AuthTokens) {
    response.cookie(ACCESS_COOKIE, accessToken, this.accessCookie);
    response.cookie(REFRESH_COOKIE, refreshToken, this.refreshCookie);
  }

  private clearCookies(response: Response) {
    const { maxAge: _accessMaxAge, ...accessOptions } = this.accessCookie;
    const { maxAge: _refreshMaxAge, ...refreshOptions } = this.refreshCookie;
    response.clearCookie(ACCESS_COOKIE, accessOptions);
    response.clearCookie(REFRESH_COOKIE, refreshOptions);
  }
}
