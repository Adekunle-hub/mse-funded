import { createHash, randomBytes } from 'node:crypto';

import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';

import type { Env } from '../config/env.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { UsersService, toPublicUser, type PublicUser } from '../users/users.service.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { SignupDto } from './dto/signup.dto.js';

const SALT_ROUNDS = 12;
const DAY_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;

export type AuthTokens = { accessToken: string; refreshToken: string };

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshTokenTtlMs: number;
  private readonly siteUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly notifications: NotificationsService,
    config: ConfigService<Env, true>,
  ) {
    this.refreshTokenTtlMs = config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true }) * DAY_MS;
    this.siteUrl = config.get('CLIENT_ORIGIN', { infer: true })[0];
  }

  async signup({ name, email, password }: SignupDto): Promise<PublicUser> {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    return this.users.create({ name, email, passwordHash });
  }

  async login({ email, password }: LoginDto): Promise<PublicUser> {
    const user = await this.users.findByEmail(email);
    const passwordMatches = user?.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !passwordMatches) {
      throw new UnauthorizedException("That email and password don't match.");
    }
    return toPublicUser(user);
  }

  async issueTokens(userId: string): Promise<AuthTokens> {
    const refreshToken = randomBytes(32).toString('base64url');

    await this.prisma.refreshToken.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } });
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + this.refreshTokenTtlMs) },
    });

    return { accessToken: await this.jwt.signAsync({ sub: userId }), refreshToken };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(refreshToken) } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Please log in');
    }

    const { count } = await this.prisma.refreshToken.deleteMany({ where: { id: stored.id } });
    if (count === 0) throw new UnauthorizedException('Please log in');

    return this.issueTokens(stored.userId);
  }

  async revoke(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(refreshToken) } });
  }

  async requestPasswordReset({ email }: ForgotPasswordDto): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user) return;

    const token = randomBytes(32).toString('base64url');
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
    });

    const link = `${this.siteUrl}/reset-password?token=${token}`;
    try {
      await this.notifications.sendPasswordReset(user.email, user.name, link);
    } catch (error) {
      this.logger.error(`Password reset email failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async resetPassword({ token, password }: ResetPasswordDto): Promise<void> {
    const stored = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new BadRequestException('This reset link is invalid or has expired');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId: stored.userId } }),
      this.prisma.refreshToken.deleteMany({ where: { userId: stored.userId } }),
    ]);
  }
}
