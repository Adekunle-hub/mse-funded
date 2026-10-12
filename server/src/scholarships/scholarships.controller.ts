import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

import { CreateReportDto } from './dto/create-report.dto.js';
import { ReportsService } from './reports.service.js';
import { ScholarshipsService } from './scholarships.service.js';

type QueryInput = Record<string, string | string[] | undefined>;

@SkipThrottle()
@Controller('scholarships')
export class ScholarshipsController {
  constructor(
    private readonly scholarships: ScholarshipsService,
    private readonly reports: ReportsService,
  ) {}

  @Get()
  search(@Query() query: QueryInput) {
    return this.scholarships.search(query);
  }

  @Get('count')
  count(@Query() query: QueryInput) {
    return this.scholarships.count(query);
  }

  @Get('featured-ids')
  prerenderIds() {
    return this.scholarships.prerenderIds();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scholarships.findOne(id);
  }

  @Get(':id/similar')
  similar(@Param('id') id: string) {
    return this.scholarships.similar(id);
  }

  @SkipThrottle({ default: false })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post(':id/reports')
  @HttpCode(201)
  report(@Param('id') id: string, @Body() dto: CreateReportDto) {
    return this.reports.create(id, dto);
  }
}
