import Link from "next/link"
import { TriangleAlert } from "lucide-react"
import type { ReactNode } from "react"

import { DeadlineBadge } from "@/components/scholarship/deadline-badge"
import { TrustLabel } from "@/components/scholarship/trust-label"
import { Pill } from "@/components/ui/pill"
import { fundingTypeLabels, studyLevelLabels } from "@/lib/scholarships/labels"
import type { ScholarshipSummary } from "@/lib/types/scholarship"
import { cn } from "@/lib/utils"

type ResultCardProps = {
  scholarship: ScholarshipSummary
  now: Date
  href?: string
  action?: ReactNode
  headingLevel?: "h2" | "h3"
  compact?: boolean
  className?: string
}

export function ResultCard({
  scholarship,
  now,
  href,
  action,
  headingLevel: Heading = "h3",
  compact = false,
  className,
}: ResultCardProps) {
  const { title, level, fundingType, institution, funder, country, fields } = scholarship

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-card border border-hairline bg-surface p-4 sm:p-6",
        href &&
          "group transition-colors duration-[120ms] active:bg-muted-bg hover:border-border-control",
        className
      )}
    >
      {scholarship.verification.status === "under-review" && scholarship.verification.note && (
        <p className="-mx-4 -mt-4 mb-3 flex gap-2 rounded-t-[5px] border-b border-amber-border bg-amber-bg px-4 py-3 type-body-sm text-amber-ink sm:-mx-6 sm:-mt-6 sm:mb-4 sm:px-6">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {scholarship.verification.note}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 sm:mb-4">
        <div className="flex flex-wrap gap-2">
          <Pill>{studyLevelLabels[level]}</Pill>
          <Pill>{fundingTypeLabels[fundingType]}</Pill>
        </div>
        <DeadlineBadge deadline={scholarship.deadline} now={now} className="max-sm:hidden" />
      </div>

      <Heading className="mt-3 line-clamp-2 type-heading-3 text-ink sm:mt-0">
        {href ? (
          <Link
            href={href}
            className="underline-offset-4 after:absolute after:inset-0 after:rounded-card group-hover:underline"
          >
            {title}
          </Link>
        ) : (
          title
        )}
      </Heading>
      <p className="mt-1 type-body-sm text-ink-muted">
        {compact ? institution : `${institution} · ${funder}`}
      </p>
      {compact ? (
        <p className="mt-1 type-body-sm text-ink-muted">{country}</p>
      ) : (
        <>
          <p className="mt-1 type-body-sm text-ink-muted max-sm:hidden">
            {country} · {fields.join(", ")}
          </p>
          <p className="mt-2 type-body-sm text-ink sm:mt-1">{scholarship.fundingSummary}</p>
        </>
      )}

      <DeadlineBadge deadline={scholarship.deadline} now={now} className="mt-3 sm:hidden" />

      <footer className="mt-3 flex items-center justify-between gap-3 border-t border-hairline pt-2 sm:mt-4 sm:pt-4">
        <TrustLabel verification={scholarship.verification} format={compact ? "short" : "long"} />
        {action && <div className="relative z-10">{action}</div>}
      </footer>
    </article>
  )
}
