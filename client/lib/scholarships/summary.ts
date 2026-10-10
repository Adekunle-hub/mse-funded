import type { ScholarshipDetail, ScholarshipSummary } from "@/lib/types/scholarship"

export function toSummaryFromDetail(detail: ScholarshipDetail): ScholarshipSummary {
  return {
    id: detail.id,
    title: detail.title,
    level: detail.level,
    fundingType: detail.fundingType,
    institution: detail.institution,
    funder: detail.funder,
    country: detail.country,
    fields: detail.fields,
    fundingSummary: detail.fundingSummary,
    deadline: detail.deadline,
    deadlineZone: detail.deadlineZone,
    officialUrl: detail.officialUrl,
    addedAt: detail.addedAt,
    verification: detail.verification,
  }
}
