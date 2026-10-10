import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

import type { Env } from '../config/env.js';
import { PrismaClient } from '../generated/prisma/client.js';

function adapterFor(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const schema = url.searchParams.get('schema') ?? undefined;
  url.searchParams.delete('schema');
  return new PrismaPg({ connectionString: url.toString() }, { schema });
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService<Env, true>) {
    super({ adapter: adapterFor(config.get('DATABASE_URL', { infer: true })) });
  }

  async onModuleInit() {
    try {
      await this.$queryRaw`SELECT 1`;
    } catch (error) {
      const reason = (error instanceof Error ? error.message : String(error)).trim().split('\n').at(-1);
      throw new Error(`Could not connect to PostgreSQL. Check DATABASE_URL in server/.env. ${reason}`);
    }
    this.logger.log('Connected to PostgreSQL');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
