import { OfficialLink } from "@/components/detail/official-link"
import { SaveButton } from "@/components/scholarship/save-button"
import { toSummaryFromDetail } from "@/lib/scholarships/summary"
import type { ScholarshipDetail } from "@/lib/types/scholarship"

type MobileActionBarProps = {
  scholarship: ScholarshipDetail
  closed: boolean
}

export function MobileActionBar({ scholarship, closed }: MobileActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-hairline bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
      <SaveButton scholarship={toSummaryFromDetail(scholarship)} layout="bar" />
      <OfficialLink url={scholarship.officialUrl} primary={!closed} className="flex-1 px-4" />
    </div>
  )
}
