import { DeadlineBadge } from "@/components/scholarship/deadline-badge"
import { formatDeadlineMoment } from "@/lib/format/date"
import type { ScholarshipDetail } from "@/lib/types/scholarship"

type KeyFactsProps = {
  scholarship: ScholarshipDetail
  now: Date
}

export function KeyFacts({ scholarship, now }: KeyFactsProps) {
  const unconfirmed = scholarship.verification.status === "under-review"
  const facts = [
    { term: "Level", value: scholarship.durationLabel },
    { term: "Country", value: [scholarship.country, scholarship.city].filter(Boolean).join(", ") },
    { term: "Field", value: scholarship.fields.join(", ") },
    { term: "Funding covers", value: scholarship.fundingCovers },
    { term: "Start date", value: scholarship.startDate },
    { term: "Open to", value: scholarship.openTo },
  ].filter((fact) => fact.value)

  return (
    <dl className="rounded-card border border-hairline bg-cream px-4 py-1 sm:grid sm:grid-cols-[180px_1fr] sm:px-6 sm:py-2">
      <div className="py-3 sm:contents">
        <dt className="type-label text-ink-muted sm:py-3.5">Deadline</dt>
        <dd className="flex flex-col items-start gap-2 font-medium sm:py-3.5">
          {scholarship.deadline ? (
            <>
              <span>
                {formatDeadlineMoment(scholarship.deadline, scholarship.deadlineZone)}
                {unconfirmed && <span className="ml-1 type-body-sm font-normal text-amber-ink">(unconfirmed)</span>}
              </span>
              <DeadlineBadge deadline={scholarship.deadline} now={now} className="max-sm:hidden" />
            </>
          ) : (
            <DeadlineBadge deadline={null} now={now} />
          )}
        </dd>
      </div>
      {facts.map((fact) => (
        <div key={fact.term} className="border-t border-hairline py-3 sm:contents">
          <dt className="type-label text-ink-muted sm:border-t sm:border-hairline sm:py-3.5">{fact.term}</dt>
          <dd className="font-medium sm:border-t sm:border-hairline sm:py-3.5">{fact.value}</dd>
        </div>
      ))}
    </dl>
  )
}
