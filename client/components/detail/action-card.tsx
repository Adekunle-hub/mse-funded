import { OfficialLink, officialDomain } from "@/components/detail/official-link"
import { ReminderToggle } from "@/components/detail/reminder-toggle"
import { ReportDialog } from "@/components/detail/report-dialog"
import { DeadlineBadge } from "@/components/scholarship/deadline-badge"
import { SaveButton } from "@/components/scholarship/save-button"
import { TrustLabel } from "@/components/scholarship/trust-label"
import { toSummaryFromDetail } from "@/lib/scholarships/summary"
import type { ScholarshipDetail } from "@/lib/types/scholarship"

type ActionCardProps = {
  scholarship: ScholarshipDetail
  now: Date
  closed: boolean
}

export function ActionCard({ scholarship, now, closed }: ActionCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-6">
      <DeadlineBadge deadline={scholarship.deadline} now={now} size="lg" />
      <div>
        <OfficialLink url={scholarship.officialUrl} primary={!closed} className="w-full" />
        <p className="mt-2 text-center type-body-sm text-ink-muted">Opens {officialDomain(scholarship.officialUrl)}</p>
      </div>
      <SaveButton scholarship={toSummaryFromDetail(scholarship)} layout="block" />
      <div className="flex flex-col gap-3.5 border-t border-hairline pt-4">
        <TrustLabel verification={scholarship.verification} />
        <ReminderToggle scholarshipId={scholarship.id} />
        <ReportDialog scholarshipId={scholarship.id} layout="link" />
      </div>
    </div>
  )
}
