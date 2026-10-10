import { calendarDaysBetween, formatDate } from "@/lib/format/date"

export type DeadlineUrgency = "comfortable" | "soon" | "urgent" | "closed"

export type DeadlineStatus = {
  urgency: DeadlineUrgency
  daysLeft: number
  label: string
}

const URGENT_MAX_DAYS = 7
const SOON_MAX_DAYS = 30

function daysLeftPhrase(daysLeft: number) {
  return daysLeft === 1 ? "1 day left" : `${daysLeft} days left`
}

export function getDeadlineStatus(
  deadline: string,
  now: Date,
  { withYear = false }: { withYear?: boolean } = {}
): DeadlineStatus {
  const deadlineDate = new Date(deadline)
  const daysLeft = calendarDaysBetween(now, deadlineDate)

  if (deadlineDate.getTime() < now.getTime()) {
    return { urgency: "closed", daysLeft: 0, label: `Closed ${formatDate(deadlineDate)}` }
  }

  if (daysLeft <= URGENT_MAX_DAYS) {
    const label = daysLeft === 0 ? "Urgent · Closes today" : `Urgent · ${daysLeftPhrase(daysLeft)}`
    return { urgency: "urgent", daysLeft, label }
  }

  const closes = `Closes ${formatDate(deadlineDate, { withYear })} · ${daysLeftPhrase(daysLeft)}`
  return {
    urgency: daysLeft <= SOON_MAX_DAYS ? "soon" : "comfortable",
    daysLeft,
    label: closes,
  }
}
