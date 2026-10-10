import { calendarDaysBetween, toCalendarDate } from "../format/date.js"
import { fieldOptions } from "../scholarships/filters.js"
import type { ScholarshipSummary } from "../types/scholarship.js"

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

export function buildLandingSnapshot(openItems: ScholarshipSummary[], now: Date): LandingSnapshot {
  const byDeadline = [...openItems].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
  const today = toCalendarDate(now)

  const deadlinesByMonth = Array.from({ length: MONTHS_AHEAD }, (_, offset) => {
    const monthIndex = (today.month - 1 + offset) % 12
    const year = today.year + Math.floor((today.month - 1 + offset) / 12)
    const count = openItems.filter((item) => {
      const date = toCalendarDate(new Date(item.deadline))
      return date.year === year && date.month - 1 === monthIndex
    }).length
    return { key: `${year}-${monthIndex + 1}`, label: MONTHS[monthIndex], count }
  })

  const next = byDeadline[0]

  return {
    generatedAt: now.toISOString(),
    openCount: openItems.length,
    countryCount: new Set(openItems.map((item) => item.country)).size,
    institutionCount: new Set(openItems.map((item) => item.institution)).size,
    closingSoon: byDeadline.slice(0, 3),
    nextDeadline: next ? { scholarship: next, daysLeft: calendarDaysBetween(now, new Date(next.deadline)) } : null,
    fieldCounts: Object.fromEntries(
      fieldOptions.map((field) => [field, openItems.filter((item) => item.fields.includes(field)).length])
    ),
    deadlinesByMonth,
  }
}
