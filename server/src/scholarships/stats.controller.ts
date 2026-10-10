import { Controller, Get } from '@nestjs/common';

import { ScholarshipsService } from './scholarships.service.js';

@Controller('stats')
export class StatsController {
  constructor(private readonly scholarships: ScholarshipsService) {}

  @Get('landing')
  landing() {
    return this.scholarships.landingSnapshot();
  }
}
