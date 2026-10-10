import { FundingType, ListingStatus, StudyLevel, type Scholarship } from '../generated/prisma/client.js';
import type { ScholarshipDetail, ScholarshipSummary } from '../shared/types/scholarship.js';

const levels: Record<StudyLevel, ScholarshipSummary['level']> = {
  [StudyLevel.MSC]: 'msc',
  [StudyLevel.PHD]: 'phd',
  [StudyLevel.MSC_PHD]: 'msc-phd',
};

const fundingTypes: Record<FundingType, ScholarshipSummary['fundingType']> = {
  [FundingType.FULLY_FUNDED]: 'fully-funded',
  [FundingType.TUITION_ONLY]: 'tuition-only',
  [FundingType.STIPEND_ONLY]: 'stipend-only',
  [FundingType.PARTIAL]: 'partial',
};

export function toSummary(row: Scholarship): ScholarshipSummary {
  return {
    id: row.slug,
    title: row.name,
    level: levels[row.level],
    fundingType: fundingTypes[row.fundingType],
    institution: row.institution,
    funder: row.funder,
    country: row.country,
    fields: row.fields,
    fundingSummary: row.fundingSummary,
    deadline: row.deadline?.toISOString() ?? null,
    deadlineZone: { id: row.deadlineTimeZone, label: row.deadlineZoneLabel },
    officialUrl: row.officialUrl,
    addedAt: row.createdAt.toISOString(),
    verification: {
      status: row.status === ListingStatus.UNDER_REVIEW ? 'under-review' : 'verified',
      checkedAt: (row.verifiedAt ?? row.updatedAt).toISOString(),
      note: row.reviewNote ?? undefined,
    },
  };
}

const levelNames: Record<StudyLevel, string> = {
  [StudyLevel.MSC]: 'MSc',
  [StudyLevel.PHD]: 'PhD',
  [StudyLevel.MSC_PHD]: 'MSc and PhD',
};

export function toDetail(row: Scholarship): ScholarshipDetail {
  return {
    ...toSummary(row),
    department: row.department ?? undefined,
    city: row.city ?? '',
    durationLabel: row.durationLabel ?? levelNames[row.level],
    fundingCovers: row.fundingCovers ?? row.fundingSummary,
    startDate: row.startDate ?? 'See the official page',
    openTo: row.openTo ?? 'See the official page',
    eligibility: row.eligibility,
    about: row.about,
    howToApply: row.howToApply,
  };
}
