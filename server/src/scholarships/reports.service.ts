import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { CreateReportDto } from './dto/create-report.dto.js';

export type ListingReport = CreateReportDto & {
  id: string;
  scholarshipId: string;
  createdAt: string;
};

@Injectable()
export class ReportsService {
  private readonly reports: ListingReport[] = [];

  create(scholarshipId: string, dto: CreateReportDto): ListingReport {
    const report: ListingReport = {
      id: randomUUID(),
      scholarshipId,
      reason: dto.reason,
      details: dto.details?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    this.reports.push(report);
    return report;
  }
}
