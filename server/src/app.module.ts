import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module.js';
import { AppConfigModule } from './config/app-config.module.js';
import { HealthController } from './health.controller.js';
import { SavedModule } from './saved/saved.module.js';
import { ScholarshipsModule } from './scholarships/scholarships.module.js';
import { SessionModule } from './session/session.module.js';

@Module({
  imports: [AppConfigModule, SessionModule, ScholarshipsModule, SavedModule, AuthModule],
  controllers: [HealthController],
})
export class AppModule {}
