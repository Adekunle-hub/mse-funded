"use client"

import Link from "next/link"
import { Check, MessageCircle } from "lucide-react"

import { DeadlineBadge } from "@/components/scholarship/deadline-badge"
import { NoteEditor } from "@/components/tracker/note-editor"
import { SavedCardMenu } from "@/components/tracker/saved-card-menu"
import { StatusSelect } from "@/components/tracker/status-select"
import { Button, buttonVariants } from "@/components/ui/button"
import { useRemoveSaved } from "@/hooks/use-saved"
import { formatDate, formatDeadlineMoment } from "@/lib/format/date"
import { routes } from "@/lib/routes"
import { studyLevelLabels } from "@/lib/scholarships/labels"
import { isClosed } from "@/lib/scholarships/tracker"
import type { SavedScholarship } from "@/lib/types/saved"
import { cn } from "@/lib/utils"

type SavedCardProps = {
  entry: SavedScholarship
  now: Date
}

function OfficialPageLink({ url, className }: { url: string; className?: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      Official page ↗<span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

export function SavedCard({ entry, now }: SavedCardProps) {
  const remove = useRemoveSaved()
  const { scholarship, status } = entry
  const closed = isClosed(entry, now)
  const meta = `${scholarship.institution} · ${studyLevelLabels[scholarship.level]} · ${scholarship.country}`

  if (closed) {
    return (
      <article className="rounded-card border border-hairline bg-surface p-4 sm:p-6">
        <h3 className="type-heading-3 text-muted-ink">{scholarship.title}</h3>
        <p className="mt-1 type-body-sm text-muted-ink">{meta}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <DeadlineBadge deadline={scholarship.deadline} now={now} />
          <Button
            variant="text"
            size="inline"
            className="h-12 text-ink-muted hover:text-ink sm:h-10"
            onClick={() => remove.mutate(entry)}
          >
            Remove
          </Button>
        </div>
      </article>
    )
  }

  return (
    <article className="rounded-card border border-hairline bg-surface p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h3 className="type-heading-3">
            <Link href={routes.scholarship(scholarship.id)} className="underline-offset-4 hover:underline">
              {scholarship.title}
            </Link>
          </h3>
          <p className="mt-1 type-body-sm text-ink-muted">{meta}</p>
        </div>
        <StatusSelect
          scholarshipId={scholarship.id}
          title={scholarship.title}
          status={status}
          className="self-start"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 sm:mt-4">
        {status === "submitted" ? (
          <>
            <span className="inline-flex items-center gap-1.5 type-body-sm">
              <Check aria-hidden="true" className="size-4 text-teal" />
              Submitted {entry.submittedAt ? formatDate(entry.submittedAt, { withYear: false }) : ""}
            </span>
            <span className="type-body-sm text-ink-muted">Deadline {formatDate(scholarship.deadline)}</span>
          </>
        ) : (
          <>
            <DeadlineBadge deadline={scholarship.deadline} now={now} />
            <span className="type-body-sm text-ink-muted">
              Closes {formatDeadlineMoment(scholarship.deadline, scholarship.deadlineZone, { short: true })}
            </span>
          </>
        )}
      </div>

      <div className="mt-3 border-t border-hairline pt-3 sm:mt-4 sm:pt-4">
        <NoteEditor scholarshipId={scholarship.id} note={entry.note} />
      </div>

      <div className="mt-3 flex gap-3 sm:hidden">
        <OfficialPageLink url={scholarship.officialUrl} className={cn(buttonVariants({ variant: "outline" }), "flex-1")} />
        <SavedCardMenu entry={entry} />
      </div>

      <footer className="mt-4 flex items-center gap-4 border-t border-hairline pt-4 max-sm:hidden">
        <OfficialPageLink
          url={scholarship.officialUrl}
          className="font-medium text-teal underline-offset-4 hover:text-teal-hover hover:underline"
        />
        {entry.remindersOn && status !== "submitted" && (
          <span className="ml-auto inline-flex items-center gap-1.5 type-body-sm text-ink-muted">
            <MessageCircle aria-hidden="true" className="size-4" />
            Reminders on
          </span>
        )}
        <Button
          variant="text"
          size="inline"
          className={cn("h-10 text-ink-muted hover:text-ink", !(entry.remindersOn && status !== "submitted") && "ml-auto")}
          onClick={() => remove.mutate(entry)}
        >
          Remove<span className="sr-only"> {scholarship.title}</span>
        </Button>
      </footer>
    </article>
  )
}
