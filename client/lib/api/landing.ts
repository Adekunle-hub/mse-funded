import { cacheLife, cacheTag } from "next/cache"

import { apiFetch } from "@/lib/api/client"
import type { ScholarshipSummary } from "@/lib/types/scholarship"

export type LandingSnapshot = {
  generatedAt: string
  openCount: number
  countryCount: number
  institutionCount: number
  closingSoon: ScholarshipSummary[]
  example: ScholarshipSummary | null
  nextDeadline: { scholarship: ScholarshipSummary; daysLeft: number } | null
  fieldCounts: Record<string, number>
  deadlinesByMonth: { key: string; label: string; count: number }[]
}

export async function getLandingSnapshot(): Promise<LandingSnapshot> {
  "use cache"
  cacheLife("hours")
  cacheTag("scholarships")

  return apiFetch<LandingSnapshot>("/stats/landing")
}
