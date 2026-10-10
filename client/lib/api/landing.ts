import { cacheLife, cacheTag } from "next/cache"

import { apiFetch } from "@/lib/api/client"
import { apiConfig } from "@/lib/api/config"
import { mockSearch } from "@/lib/data/mock-search"
import { calendarDaysBetween, toCalendarDate } from "@/lib/format/date"
import { defaultFilters, fieldOptions } from "@/lib/scholarships/filters"
import type { ScholarshipSummary } from "@/lib/types/scholarship"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const MONTHS_AHEAD = 6

export type LandingSnapshot = {
  generatedAt: string
  openCount: number
  countryCount: number
  institutionCount: number
  closingSoon: ScholarshipSummary[]
  nextDeadline: { scholarship: ScholarshipSummary; daysLeft: number } | null
  fieldCounts: Record<string, number>
  deadlinesByMonth: { key: string; label: string; count: number }[]
}

function buildSnapshot(items: ScholarshipSummary[], now: Date): LandingSnapshot {
  const byDeadline = [...items].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  )
  const today = toCalendarDate(now)

  const deadlinesByMonth = Array.from({ length: MONTHS_AHEAD }, (_, offset) => {
    const monthIndex = (today.month - 1 + offset) % 12
    const year = today.year + Math.floor((today.month - 1 + offset) / 12)
    const count = items.filter((item) => {
      const date = toCalendarDate(new Date(item.deadline))
      return date.year === year && date.month - 1 === monthIndex
    }).length
    return { key: `${year}-${monthIndex + 1}`, label: MONTHS[monthIndex], count }
  })

  const next = byDeadline[0]

  return {
    generatedAt: now.toISOString(),
    openCount: items.length,
    countryCount: new Set(items.map((item) => item.country)).size,
    institutionCount: new Set(items.map((item) => item.institution)).size,
    closingSoon: byDeadline.slice(0, 3),
    nextDeadline: next ? { scholarship: next, daysLeft: calendarDaysBetween(now, new Date(next.deadline)) } : null,
    fieldCounts: Object.fromEntries(
      fieldOptions.map((field) => [field, items.filter((item) => item.fields.includes(field)).length])
    ),
    deadlinesByMonth,
  }
}

export async function getLandingSnapshot(): Promise<LandingSnapshot> {
  "use cache"
  cacheLife("hours")
  cacheTag("scholarships")

  const now = new Date()
  if (apiConfig.useMock) {
    const { items } = mockSearch({ ...defaultFilters, page: 50 }, now)
    return buildSnapshot(items, now)
  }
  return apiFetch<LandingSnapshot>("/stats/landing")
}
