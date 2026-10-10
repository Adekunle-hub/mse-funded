import { ConflictException, Injectable } from '@nestjs/common';

import type { GoogleProfile } from '../auth/google-auth.service.js';
import { Prisma, type User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const publicUserFields = { id: true, name: true, email: true, role: true } as const;

export type PublicUser = { id: string; name: string; email: string; isAdmin: boolean };
export type NewUser = { name: string; email: string; passwordHash: string };

export function toPublicUser({ id, name, email, role }: Pick<User, 'id' | 'name' | 'email' | 'role'>): PublicUser {
  return { id, name, email, isAdmin: role === 'ADMIN' };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PublicUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: publicUserFields });
    return user ? toPublicUser(user) : null;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: NewUser): Promise<PublicUser> {
    try {
      return toPublicUser(await this.prisma.user.create({ data, select: publicUserFields }));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An account with this email already exists');
      }
      throw error;
    }
  }

  async findOrCreateFromGoogle({ googleId, email, name, emailVerified }: GoogleProfile): Promise<PublicUser> {
    const linked = await this.prisma.user.findUnique({ where: { googleId }, select: publicUserFields });
    if (linked) return toPublicUser(linked);

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (!emailVerified) throw new ConflictException('An account with this email already exists');
      return toPublicUser(
        await this.prisma.user.update({ where: { id: existing.id }, data: { googleId }, select: publicUserFields }),
      );
    }

    return toPublicUser(await this.prisma.user.create({ data: { googleId, email, name }, select: publicUserFields }));
  }

  async isAdmin(id: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { role: true } });
    return user?.role === 'ADMIN';
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }
}
