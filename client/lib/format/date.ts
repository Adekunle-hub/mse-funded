import { siteConfig } from "@/lib/site-config"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const partsFormatters = new Map<string, Intl.DateTimeFormat>()

function partsFormatter(timeZone: string) {
  let formatter = partsFormatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
    partsFormatters.set(timeZone, formatter)
  }
  return formatter
}

export type CalendarDate = { year: number; month: number; day: number; hour: number; minute: number }

export function toCalendarDate(date: Date, timeZone: string = siteConfig.timeZone): CalendarDate {
  const parts = partsFormatter(timeZone).formatToParts(date)
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
  }
}

export function formatDate(
  value: Date | string,
  { withYear = true, timeZone }: { withYear?: boolean; timeZone?: string } = {}
): string {
  const { year, month, day } = toCalendarDate(new Date(value), timeZone)
  const dayMonth = `${day} ${MONTHS[month - 1]}`
  return withYear ? `${dayMonth} ${year}` : dayMonth
}

export function formatTime(value: Date | string, timeZone?: string) {
  const { hour, minute } = toCalendarDate(new Date(value), timeZone)
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

export function monthDayParts(value: Date | string) {
  const { month, day } = toCalendarDate(new Date(value))
  return { month: MONTHS[month - 1].toUpperCase(), day: String(day).padStart(2, "0") }
}

export function formatDeadlineMoment(
  deadline: string | null,
  zone: { id: string; label: string },
  { withYear = true, short = false }: { withYear?: boolean; short?: boolean } = {}
) {
  if (!deadline) return "No fixed deadline"
  const date = new Date(deadline)
  const sourceDate = formatDate(date, { timeZone: zone.id, withYear })
  const sourceTime = formatTime(date, zone.id)
  const lagosTime = formatTime(date)
  const lagosDate = formatDate(date, { withYear: false })
  const sameDay = formatDate(date, { timeZone: zone.id, withYear: false }) === lagosDate
  const zoneLabel = short ? zone.label.replace(" time", "") : zone.label

  let lagos: string
  if (lagosTime === sourceTime && sameDay) lagos = "same time in Lagos"
  else if (sameDay) lagos = `${lagosTime}${short ? " Lagos" : " in Lagos"}`
  else lagos = `${lagosTime} on ${lagosDate}${short ? " Lagos" : " in Lagos"}`

  return `${sourceDate}, ${sourceTime} ${zoneLabel} (${lagos})`
}

export function calendarDaysBetween(from: Date, to: Date): number {
  const a = toCalendarDate(from)
  const b = toCalendarDate(to)
  const msPerDay = 86_400_000
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / msPerDay
  )
}
