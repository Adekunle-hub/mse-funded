"use client"

import Link from "next/link"
import { AlarmClock, Bookmark, ChevronDown, CircleAlert } from "lucide-react"
import { useState } from "react"

import { ResultListSkeleton } from "@/components/scholarship/result-card-skeleton"
import { ReminderList, RemindersPanel } from "@/components/tracker/reminders-panel"
import { SavedCard } from "@/components/tracker/saved-card"
import { Button, buttonVariants } from "@/components/ui/button"
import { useNow } from "@/hooks/use-now"
import { useSavedList } from "@/hooks/use-saved"
import { routes } from "@/lib/routes"
import {
  isClosed,
  sortEntries,
  statusLabels,
  statusOrder,
  upcomingReminders,
  type StatusFilter,
  type TrackerSort,
} from "@/lib/scholarships/tracker"
import type { SavedScholarship } from "@/lib/types/saved"
import { cn } from "@/lib/utils"

export function TrackerView() {
  const now = useNow()
  const saved = useSavedList()
  const [filter, setFilter] = useState<StatusFilter>("all")
  const [sort, setSort] = useState<TrackerSort>("deadline")

  if (saved.isError) {
    return (
      <div role="alert" className="mt-6 flex gap-4 rounded-card border border-hairline bg-error-bg p-6">
        <CircleAlert aria-hidden="true" className="size-6 shrink-0 text-error" />
        <div>
          <h2 className="type-heading-3">We couldn&apos;t load your saved list</h2>
          <p className="mt-1 text-ink-muted">Your connection may have dropped.</p>
          <Button variant="primary" className="mt-4" onClick={() => saved.refetch()}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  if (!now || saved.isPending) {
    return (
      <div className="mt-6">
        <ResultListSkeleton />
      </div>
    )
  }

  const entries = saved.data
  if (entries.length === 0) return <EmptySaved />

  const open = entries.filter((entry) => !isClosed(entry, now))
  const closed = entries.filter((entry) => isClosed(entry, now))
  const visible = sortEntries(filter === "all" ? open : open.filter((entry) => entry.status === filter), sort)
  const dueThisWeek = upcomingReminders(entries, now).thisWeek.length

  const counts: Record<StatusFilter, number> = {
    all: entries.length,
    interested: entries.filter((entry) => entry.status === "interested").length,
    applying: entries.filter((entry) => entry.status === "applying").length,
    submitted: entries.filter((entry) => entry.status === "submitted").length,
  }

  return (
    <>
      <p className="mt-1 type-body-sm text-ink-muted max-sm:hidden">
        {entries.length} saved · {dueThisWeek} {dueThisWeek === 1 ? "deadline" : "deadlines"} in the next 7 days
      </p>

      <MobileReminders entries={entries} now={now} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 sm:mt-6">
        <StatusFilterControl value={filter} counts={counts} onChange={setFilter} />
        <label className="relative inline-flex h-10 items-center rounded-control border border-border-control type-label focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink max-sm:hidden">
          <span aria-hidden="true" className="pointer-events-none pl-3.5">
            Sort:
          </span>
          <span className="sr-only">Sort saved scholarships by</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as TrackerSort)}
            className="h-full cursor-pointer appearance-none bg-transparent pr-9 pl-1.5 outline-none"
          >
            <option value="deadline">Deadline, soonest first</option>
            <option value="saved">Recently saved</option>
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 size-4" />
        </label>
      </div>

      <div className="mt-4 flex items-start gap-8 sm:mt-6">
        <section aria-labelledby="saved-list-title" className="flex min-w-0 flex-1 flex-col gap-4">
          <h2 id="saved-list-title" className="sr-only">
            {filter === "all" ? "Saved scholarships" : statusLabels[filter]}
          </h2>
          {visible.length === 0 && filter !== "all" && (
            <p className="rounded-card border border-hairline p-6 text-ink-muted">
              Nothing marked {statusLabels[filter].toLowerCase()} yet.
            </p>
          )}
          <ul className="flex flex-col gap-3 sm:gap-4">
            {visible.map((entry) => (
              <li key={entry.scholarship.id}>
                <SavedCard entry={entry} now={now} />
              </li>
            ))}
          </ul>

          {filter === "all" && closed.length > 0 && (
            <>
              <div className="mt-2 flex items-center gap-3" role="separator" aria-label="Closed">
                <span className="flex-1 border-t border-hairline" />
                <span className="type-label text-ink-muted">Closed</span>
                <span className="flex-1 border-t border-hairline" />
              </div>
              <ul className="flex flex-col gap-3 sm:gap-4">
                {closed.map((entry) => (
                  <li key={entry.scholarship.id}>
                    <SavedCard entry={entry} now={now} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <aside className="sticky top-24 w-90 shrink-0 max-lg:hidden">
          <RemindersPanel entries={entries} now={now} />
        </aside>
      </div>
    </>
  )
}

type StatusFilterControlProps = {
  value: StatusFilter
  counts: Record<StatusFilter, number>
  onChange: (value: StatusFilter) => void
}

function StatusFilterControl({ value, counts, onChange }: StatusFilterControlProps) {
  const options: StatusFilter[] = ["all", ...statusOrder]

  return (
    <div
      role="group"
      aria-label="Filter by status"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:gap-0 sm:overflow-hidden sm:rounded-control sm:border sm:border-border-control sm:px-0"
    >
      {options.map((option) => {
        const active = option === value
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={cn(
              "inline-flex h-12 shrink-0 items-center gap-1.5 rounded-md border border-border-control px-4 type-label whitespace-nowrap",
              "sm:h-10 sm:rounded-none sm:border-0 sm:border-l sm:border-hairline sm:first:border-l-0",
              active ? "border-ink bg-ink text-white" : "bg-surface text-ink hover:bg-muted-bg"
            )}
          >
            {option === "all" ? "All" : statusLabels[option]} {counts[option]}
          </button>
        )
      })}
    </div>
  )
}

function MobileReminders({ entries, now }: { entries: SavedScholarship[]; now: Date }) {
  const { thisWeek, nextMonth } = upcomingReminders(entries, now)
  const next = thisWeek[0] ?? nextMonth[0]
  if (!next) return null

  const heading =
    thisWeek.length > 0
      ? `${thisWeek.length} ${thisWeek.length === 1 ? "deadline" : "deadlines"} this week`
      : "Next deadline"

  return (
    <details className="group mt-4 rounded-card border border-hairline bg-cream p-4 lg:hidden">
      <summary className="flex cursor-pointer list-none items-start gap-3 [&::-webkit-details-marker]:hidden">
        <AlarmClock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-plum" />
        <span className="flex-1">
          <span className="block font-medium">{heading}</span>
          <span className="mt-0.5 block type-body-sm text-ink-muted">
            {next.entry.scholarship.title} · {next.days} {next.days === 1 ? "day" : "days"} left
          </span>
        </span>
        <ChevronDown aria-hidden="true" className="size-5 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-4 border-t border-hairline pt-3">
        <ReminderList entries={entries} now={now} />
      </div>
    </details>
  )
}

function EmptySaved() {
  return (
    <div className="mx-auto mt-10 flex max-w-100 flex-col items-center rounded-card border border-hairline px-8 py-12 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-md bg-mint text-teal-ink">
        <Bookmark aria-hidden="true" className="size-7" />
      </span>
      <h2 className="mt-5 type-heading-2">Nothing saved yet</h2>
      <p className="mt-2 text-ink-muted">
        Save scholarships to track deadlines, add notes and get reminders here.
      </p>
      <Link href={routes.scholarships} className={cn(buttonVariants({ variant: "primary" }), "mt-6")}>
        Find scholarships
      </Link>
    </div>
  )
}
