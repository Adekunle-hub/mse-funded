import { ConflictException, Injectable } from '@nestjs/common';
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const KEY_LENGTH = 64;

export type PublicUser = { id: string; name: string; email: string };

type StoredUser = PublicUser & { salt: Buffer; passwordHash: Buffer };

@Injectable()
export class UsersService {
  private readonly usersByEmail = new Map<string, StoredUser>();

  async create(name: string, email: string, password: string): Promise<PublicUser> {
    const key = email.toLowerCase();
    if (this.usersByEmail.has(key)) throw new ConflictException('An account with this email already exists');

    const salt = randomBytes(16);
    const passwordHash = await scryptAsync(password, salt, KEY_LENGTH);
    const user: StoredUser = { id: randomUUID(), name, email: key, salt, passwordHash };
    this.usersByEmail.set(key, user);
    return this.toPublic(user);
  }

  async verify(email: string, password: string): Promise<PublicUser | null> {
    const user = this.usersByEmail.get(email.toLowerCase());
    const salt = user?.salt ?? randomBytes(16);
    const candidate = await scryptAsync(password, salt, KEY_LENGTH);
    if (!user || !timingSafeEqual(candidate, user.passwordHash)) return null;
    return this.toPublic(user);
  }

  findById(id: string): PublicUser | null {
    for (const user of this.usersByEmail.values()) {
      if (user.id === id) return this.toPublic(user);
    }
    return null;
  }

  private toPublic({ id, name, email }: StoredUser): PublicUser {
    return { id, name, email };
  }
}
