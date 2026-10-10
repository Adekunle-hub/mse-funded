import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

const REPORT_REASONS = ['broken-link', 'wrong-deadline', 'wrong-details', 'looks-fake', 'other'] as const;
const MAX_DETAILS_LENGTH = 1000;

export type ReportReason = (typeof REPORT_REASONS)[number];

export type ListingReport = {
  id: string;
  scholarshipId: string;
  reason: ReportReason;
  details?: string;
  reporter: string;
  createdAt: string;
};

@Injectable()
export class ReportsService {
  private readonly reports: ListingReport[] = [];

  create(scholarshipId: string, reporter: string, body: unknown): ListingReport {
    const { reason, details } = (body ?? {}) as { reason?: unknown; details?: unknown };

    if (typeof reason !== 'string' || !REPORT_REASONS.includes(reason as ReportReason)) {
      throw new BadRequestException(`reason must be one of: ${REPORT_REASONS.join(', ')}`);
    }
    if (details !== undefined && (typeof details !== 'string' || details.length > MAX_DETAILS_LENGTH)) {
      throw new BadRequestException(`details must be text of at most ${MAX_DETAILS_LENGTH} characters`);
    }

    const report: ListingReport = {
      id: randomUUID(),
      scholarshipId,
      reason: reason as ReportReason,
      details: details?.trim() || undefined,
      reporter,
      createdAt: new Date().toISOString(),
    };
    this.reports.push(report);
    return report;
  }
}
