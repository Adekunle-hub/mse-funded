import { AlarmClock, Bell, Mail } from "lucide-react"

import { monthDayParts } from "@/lib/format/date"
import { closesInLabel, upcomingReminders } from "@/lib/scholarships/tracker"
import type { SavedScholarship } from "@/lib/types/saved"
import { cn } from "@/lib/utils"

type ReminderRowsProps = {
  rows: ReturnType<typeof upcomingReminders>["thisWeek"]
  urgent: boolean
}

function ReminderRows({ rows, urgent }: ReminderRowsProps) {
  return (
    <ul>
      {rows.map(({ entry, days }) => {
        if (!entry.scholarship.deadline) return null
        const { month, day } = monthDayParts(entry.scholarship.deadline)
        return (
          <li key={entry.scholarship.id} className="flex items-center gap-3 border-t border-hairline py-3 first:border-t-0">
            <span
              aria-hidden="true"
              className="flex h-13 w-12 shrink-0 flex-col items-center justify-center rounded-control border border-hairline"
            >
              <span className="text-[11px] leading-[14px] font-medium tracking-wide text-ink-muted">{month}</span>
              <span className="text-lg leading-[22px] font-semibold">{day}</span>
            </span>
            <div className="min-w-0">
              <p className="truncate type-body-sm font-medium">{entry.scholarship.title}</p>
              <p className={cn("inline-flex items-center gap-1 type-body-sm", urgent ? "text-plum" : "text-ink-muted")}>
                {urgent && <AlarmClock aria-hidden="true" className="size-4" />}
                {closesInLabel(days)}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function ReminderList({ entries, now }: { entries: SavedScholarship[]; now: Date }) {
  const { thisWeek, nextMonth } = upcomingReminders(entries, now)

  if (thisWeek.length === 0 && nextMonth.length === 0) {
    return <p className="type-body-sm text-ink-muted">No saved deadlines in the next 30 days.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {thisWeek.length > 0 && (
        <div>
          <h3 className="type-label text-ink-muted">This week</h3>
          <ReminderRows rows={thisWeek} urgent />
        </div>
      )}
      {nextMonth.length > 0 && (
        <div>
          <h3 className="type-label text-ink-muted">Next 30 days</h3>
          <ReminderRows rows={nextMonth} urgent={false} />
        </div>
      )}
    </div>
  )
}

export function RemindersPanel({ entries, now }: { entries: SavedScholarship[]; now: Date }) {
  return (
    <section aria-labelledby="reminders-title" className="rounded-card border border-hairline bg-surface p-6">
      <h2 id="reminders-title" className="flex items-center gap-2 type-heading-2">
        <Bell aria-hidden="true" className="size-5" />
        Upcoming reminders
      </h2>
      <div className="mt-5">
        <ReminderList entries={entries} now={now} />
      </div>
      <p className="mt-2 flex gap-2 border-t border-hairline pt-4 type-body-sm text-ink-muted">
        <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        We email you 7, 3 and 1 day before each saved deadline.
      </p>
    </section>
  )
}
