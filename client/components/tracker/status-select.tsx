"use client"

import { Bookmark, Check, ChevronDown, PenLine, type LucideIcon } from "lucide-react"

import { useUpdateSaved } from "@/hooks/use-saved"
import { statusLabels, statusOrder } from "@/lib/scholarships/tracker"
import type { ApplicationStatus } from "@/lib/types/saved"
import { cn } from "@/lib/utils"

const statusStyles: Record<ApplicationStatus, { icon: LucideIcon; className: string }> = {
  interested: { icon: Bookmark, className: "border-border-control bg-surface text-ink" },
  applying: { icon: PenLine, className: "border-hairline bg-cream text-ink" },
  submitted: { icon: Check, className: "border-hairline bg-mint text-teal-ink" },
}

type StatusSelectProps = {
  scholarshipId: string
  title: string
  status: ApplicationStatus
  className?: string
}

export function StatusSelect({ scholarshipId, title, status, className }: StatusSelectProps) {
  const update = useUpdateSaved()
  const { icon: Icon, className: tone } = statusStyles[status]

  return (
    <label
      className={cn(
        "relative inline-flex h-10 shrink-0 items-center rounded-md border type-label focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink sm:h-9",
        tone,
        className
      )}
    >
      <Icon aria-hidden="true" className="pointer-events-none absolute left-3.5 size-4" />
      <span className="sr-only">Application status for {title}</span>
      <select
        value={status}
        onChange={(event) =>
          update.mutate({ id: scholarshipId, changes: { status: event.target.value as ApplicationStatus } })
        }
        className="h-full cursor-pointer appearance-none rounded-md bg-transparent pr-8 pl-9 outline-none"
      >
        {statusOrder.map((value) => (
          <option key={value} value={value}>
            {statusLabels[value]}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 size-4" />
    </label>
  )
}
