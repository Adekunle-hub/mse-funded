import { calendarDaysBetween } from "@/lib/format/date"
import type { ApplicationStatus, SavedScholarship } from "@/lib/types/saved"

export type StatusFilter = "all" | ApplicationStatus
export type TrackerSort = "deadline" | "saved"

export const statusLabels: Record<ApplicationStatus, string> = {
  interested: "Interested",
  applying: "Applying",
  submitted: "Submitted",
}

export const statusOrder: ApplicationStatus[] = ["interested", "applying", "submitted"]

export function isClosed(entry: SavedScholarship, now: Date) {
  return new Date(entry.scholarship.deadline).getTime() < now.getTime()
}

export function daysLeft(entry: SavedScholarship, now: Date) {
  return calendarDaysBetween(now, new Date(entry.scholarship.deadline))
}

export function sortEntries(entries: SavedScholarship[], sort: TrackerSort) {
  return [...entries].sort((a, b) =>
    sort === "saved"
      ? new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      : new Date(a.scholarship.deadline).getTime() - new Date(b.scholarship.deadline).getTime()
  )
}

export function upcomingReminders(entries: SavedScholarship[], now: Date) {
  const upcoming = entries
    .filter((entry) => entry.status !== "submitted" && !isClosed(entry, now))
    .map((entry) => ({ entry, days: daysLeft(entry, now) }))
    .filter(({ days }) => days <= 30)
    .sort((a, b) => a.days - b.days)

  return {
    thisWeek: upcoming.filter(({ days }) => days <= 7),
    nextMonth: upcoming.filter(({ days }) => days > 7),
  }
}

export function closesInLabel(days: number) {
  if (days === 0) return "Closes today"
  if (days === 1) return "Closes tomorrow"
  return `Closes in ${days} days`
}
