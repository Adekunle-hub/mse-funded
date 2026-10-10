import { Body, Controller, Get, HttpCode, Param, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

import { SessionService } from '../session/session.service.js';
import { ReportsService } from './reports.service.js';
import { ScholarshipsService } from './scholarships.service.js';

type QueryInput = Record<string, string | string[] | undefined>;

@Controller('scholarships')
export class ScholarshipsController {
  constructor(
    private readonly scholarships: ScholarshipsService,
    private readonly reports: ReportsService,
    private readonly sessions: SessionService,
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

  @Post(':id/reports')
  @HttpCode(201)
  report(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.scholarships.findOne(id);
    const sessionId = this.sessions.ensure(request, response);
    const { id: reportId, createdAt } = this.reports.create(id, this.sessions.ownerKey(sessionId), body);
    return { id: reportId, createdAt };
  }
}
