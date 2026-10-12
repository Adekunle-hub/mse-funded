import { Body, Controller, Get, HttpCode, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard.js';
import { ReportsService } from '../scholarships/reports.service.js';
import { VerificationService } from '../verification/verification.service.js';
import { AdminListingsService, pageNumber } from './admin-listings.service.js';
import { AdminSourcesService } from './admin-sources.service.js';
import { AdminGuard } from './admin.guard.js';
import { AdminService } from './admin.service.js';
import { ApproveDto, CreateSourceDto, toDeadline, UpdateListingDto, UpdateSourceDto } from './dto/admin.dto.js';

@UseGuards(AuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly listings: AdminListingsService,
    private readonly sources: AdminSourcesService,
    private readonly reports: ReportsService,
    private readonly verification: VerificationService,
  ) {}

  @Get('summary')
  summary() {
    return this.admin.summary();
  }

  @Get('review')
  review() {
    return this.admin.heldForReview();
  }

  @Post('review/:id/publish')
  async publish(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ApproveDto) {
    const status = await this.verification.approve(id, { officialUrl: dto.officialUrl, deadline: toDeadline(dto.deadline) });
    if (status === 'MISSING') throw new NotFoundException('Nothing to review with this id');
    return { status };
  }

  @Post('review/:id/reject')
  async reject(@Param('id', ParseUUIDPipe) id: string) {
    const status = await this.verification.reject(id);
    if (status === 'MISSING') throw new NotFoundException('Nothing to review with this id');
    return { status };
  }

  @Get('reports')
  openReports() {
    return this.reports.listOpen();
  }

  @Post('reports/:id/resolve')
  @HttpCode(204)
  resolveReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.reports.resolve(id);
  }

  @Get('listings')
  listListings(@Query('q') q?: string, @Query('status') status?: string, @Query('page') page?: string) {
    return this.listings.list(q, status, pageNumber(page));
  }

  @Patch('listings/:id')
  updateListing(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateListingDto) {
    return this.listings.update(id, dto);
  }

  @Get('sources')
  listSources(@Query('q') q?: string, @Query('problems') problems?: string, @Query('page') page?: string) {
    return this.sources.list(q, problems === 'true', pageNumber(page));
  }

  @Post('sources')
  addSource(@Body() dto: CreateSourceDto) {
    return this.sources.create(dto);
  }

  @Patch('sources/:id')
  updateSource(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSourceDto) {
    return this.sources.setActive(id, dto.isActive);
  }

  @Post('pages/retry-failed')
  retryFailedPages() {
    return this.sources.retryFailedPages();
  }
}
