import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import type { AppConfigService } from './config/app-config.module.js';
import { setupDocs } from './swagger.js';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  const config = app.get<AppConfigService>(ConfigService);
  if (config.get('NODE_ENV', { infer: true }) !== 'production') setupDocs(app);
  await app.listen(config.get('PORT', { infer: true }));
}

await bootstrap();
