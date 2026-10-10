import { Injectable, NotFoundException } from '@nestjs/common';

import { ApplicationStatus, type Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toSummary } from '../scholarships/scholarship.mapper.js';
import type { SavedScholarship } from '../shared/types/saved.js';
import { UpdateSavedDto } from './dto/update-saved.dto.js';

const toDbStatus: Record<NonNullable<UpdateSavedDto['status']>, ApplicationStatus> = {
  interested: ApplicationStatus.INTERESTED,
  applying: ApplicationStatus.APPLYING,
  submitted: ApplicationStatus.SUBMITTED,
};

const fromDbStatus: Record<ApplicationStatus, SavedScholarship['status']> = {
  [ApplicationStatus.INTERESTED]: 'interested',
  [ApplicationStatus.APPLYING]: 'applying',
  [ApplicationStatus.SUBMITTED]: 'submitted',
};

type SavedRow = Prisma.SavedScholarshipGetPayload<{ include: { scholarship: true } }>;

function toSaved(row: SavedRow): SavedScholarship {
  return {
    scholarship: toSummary(row.scholarship),
    status: fromDbStatus[row.status],
    note: row.note,
    remindersOn: row.remindersOn,
    savedAt: row.createdAt.toISOString(),
    submittedAt: row.submittedAt?.toISOString(),
  };
}

type SavedChanges = {
  status?: ApplicationStatus;
  note?: string;
  remindersOn?: boolean;
  submittedAt?: Date | null;
};

function changesFrom(dto: UpdateSavedDto, current?: SavedRow): SavedChanges {
  const data: SavedChanges = {};
  if (dto.note !== undefined) data.note = dto.note.trim();
  if (dto.remindersOn !== undefined) data.remindersOn = dto.remindersOn;
  if (dto.status !== undefined) {
    data.status = toDbStatus[dto.status];
    if (dto.status !== 'submitted') data.submittedAt = null;
    else if (current?.status !== ApplicationStatus.SUBMITTED) data.submittedAt = new Date();
  }
  return data;
}

@Injectable()
export class SavedService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<SavedScholarship[]> {
    const rows = await this.prisma.savedScholarship.findMany({
      where: { userId },
      include: { scholarship: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toSaved);
  }

  async save(userId: string, slug: string, dto: UpdateSavedDto): Promise<SavedScholarship> {
    const scholarship = await this.prisma.scholarship.findUnique({ where: { slug } });
    if (!scholarship) throw new NotFoundException('Scholarship not found');

    const current = await this.findSaved(userId, slug);
    if (current) return this.applyChanges(current, dto);

    const row = await this.prisma.savedScholarship.create({
      data: { userId, scholarshipId: scholarship.id, ...changesFrom(dto) },
      include: { scholarship: true },
    });
    return toSaved(row);
  }

  async update(userId: string, slug: string, dto: UpdateSavedDto): Promise<SavedScholarship> {
    const current = await this.findSaved(userId, slug);
    if (!current) throw new NotFoundException('This scholarship is not in your saved list');
    return this.applyChanges(current, dto);
  }

  async remove(userId: string, slug: string): Promise<void> {
    await this.prisma.savedScholarship.deleteMany({ where: { userId, scholarship: { slug } } });
  }

  private findSaved(userId: string, slug: string) {
    return this.prisma.savedScholarship.findFirst({
      where: { userId, scholarship: { slug } },
      include: { scholarship: true },
    });
  }

  private async applyChanges(current: SavedRow, dto: UpdateSavedDto) {
    const row = await this.prisma.savedScholarship.update({
      where: { id: current.id },
      data: changesFrom(dto, current),
      include: { scholarship: true },
    });
    return toSaved(row);
  }
}
