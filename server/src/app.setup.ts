import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

import type { AppConfigService } from './config/app-config.module.js';

export function configureApp<T extends INestApplication>(app: T): T {
  const config = app.get<AppConfigService>(ConfigService);

  app.use(cookieParser());
  app.enableCors({ origin: config.get('CLIENT_ORIGIN', { infer: true }), credentials: true });
  app.enableShutdownHooks();
  return app;
}
