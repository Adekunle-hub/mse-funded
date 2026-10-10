import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { PrismaService } from './prisma/prisma.service.js';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.log('Usage: npm run make-admin -- you@example.com');
  process.exit(1);
}

const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
const { count } = await app.get(PrismaService).user.updateMany({ where: { email }, data: { role: 'ADMIN' } });
console.log(count ? `${email} is now an admin` : `No account found for ${email}. Sign up first, then run this again.`);
await app.close();
