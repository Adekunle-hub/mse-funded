import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import type { AppConfigService } from './config/app-config.module.js';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  const config = app.get<AppConfigService>(ConfigService);
  await app.listen(config.get('PORT', { infer: true }));
}

await bootstrap();
