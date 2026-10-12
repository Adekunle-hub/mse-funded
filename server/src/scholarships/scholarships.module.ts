import { Module } from '@nestjs/common';

import { ReportsService } from './reports.service.js';
import { ScholarshipsController } from './scholarships.controller.js';
import { ScholarshipsService } from './scholarships.service.js';
import { StatsController } from './stats.controller.js';

@Module({
  controllers: [ScholarshipsController, StatsController],
  providers: [ScholarshipsService, ReportsService],
  exports: [ScholarshipsService, ReportsService],
})
export class ScholarshipsModule {}
