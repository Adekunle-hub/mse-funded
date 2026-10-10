import { Module } from '@nestjs/common';

import { ScholarshipsModule } from '../scholarships/scholarships.module.js';
import { SavedController } from './saved.controller.js';
import { SavedService } from './saved.service.js';

@Module({
  imports: [ScholarshipsModule],
  controllers: [SavedController],
  providers: [SavedService],
  exports: [SavedService],
})
export class SavedModule {}
