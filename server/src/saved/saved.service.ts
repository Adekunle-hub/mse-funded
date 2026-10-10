import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { ScholarshipsService } from '../scholarships/scholarships.service.js';
import { toSummaryFromDetail } from '../shared/scholarships/summary.js';
import type { ApplicationStatus, SavedScholarship, SavedScholarshipUpdate } from '../shared/types/saved.js';

const STATUSES: ApplicationStatus[] = ['interested', 'applying', 'submitted'];
const MAX_NOTE_LENGTH = 2000;

function parseUpdate(body: unknown): SavedScholarshipUpdate {
  const { status, note, remindersOn } = (body ?? {}) as Record<string, unknown>;
  const update: SavedScholarshipUpdate = {};

  if (status !== undefined) {
    if (!STATUSES.includes(status as ApplicationStatus)) {
      throw new BadRequestException(`status must be one of: ${STATUSES.join(', ')}`);
    }
    update.status = status as ApplicationStatus;
  }
  if (note !== undefined) {
    if (typeof note !== 'string' || note.length > MAX_NOTE_LENGTH) {
      throw new BadRequestException(`note must be text of at most ${MAX_NOTE_LENGTH} characters`);
    }
    update.note = note.trim();
  }
  if (remindersOn !== undefined) {
    if (typeof remindersOn !== 'boolean') throw new BadRequestException('remindersOn must be true or false');
    update.remindersOn = remindersOn;
  }
  return update;
}

@Injectable()
export class SavedService {
  private readonly lists = new Map<string, SavedScholarship[]>();

  constructor(private readonly scholarships: ScholarshipsService) {}

  list(owner: string): SavedScholarship[] {
    return this.lists.get(owner) ?? [];
  }

  save(owner: string, scholarshipId: string, body: unknown): SavedScholarship {
    const update = parseUpdate(body);
    const items = this.list(owner);
    const existing = items.find((item) => item.scholarship.id === scholarshipId);
    if (existing) return this.applyUpdate(owner, existing, update);

    const scholarship = toSummaryFromDetail(this.scholarships.findOne(scholarshipId));
    const created: SavedScholarship = {
      scholarship,
      status: 'interested',
      note: '',
      remindersOn: true,
      savedAt: new Date().toISOString(),
    };
    this.lists.set(owner, [created, ...items]);
    return this.applyUpdate(owner, created, update);
  }

  update(owner: string, scholarshipId: string, body: unknown): SavedScholarship {
    const existing = this.list(owner).find((item) => item.scholarship.id === scholarshipId);
    if (!existing) throw new NotFoundException('This scholarship is not in your saved list');
    return this.applyUpdate(owner, existing, parseUpdate(body));
  }

  remove(owner: string, scholarshipId: string) {
    this.lists.set(
      owner,
      this.list(owner).filter((item) => item.scholarship.id !== scholarshipId),
    );
  }

  mergeInto(fromOwner: string, toOwner: string) {
    if (fromOwner === toOwner) return;
    const target = this.list(toOwner);
    const additions = this.list(fromOwner).filter(
      (item) => !target.some((existing) => existing.scholarship.id === item.scholarship.id),
    );
    this.lists.set(toOwner, [...additions, ...target]);
    this.lists.delete(fromOwner);
  }

  private applyUpdate(owner: string, entry: SavedScholarship, update: SavedScholarshipUpdate): SavedScholarship {
    const next: SavedScholarship = { ...entry, ...update };
    if (update.status === 'submitted' && entry.status !== 'submitted') next.submittedAt = new Date().toISOString();
    if (update.status && update.status !== 'submitted') delete next.submittedAt;

    this.lists.set(
      owner,
      this.list(owner).map((item) => (item.scholarship.id === entry.scholarship.id ? next : item)),
    );
    return next;
  }
}
