import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

import { ScholarshipsService } from './scholarships.service.js';

@SkipThrottle()
@Controller('stats')
export class StatsController {
  constructor(private readonly scholarships: ScholarshipsService) {}

  @Get('landing')
  landing() {
    return this.scholarships.landingSnapshot();
  }
}
