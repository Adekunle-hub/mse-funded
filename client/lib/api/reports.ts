import { apiFetch } from "@/lib/api/client"

export const reportReasons = [
  { value: "broken-link", label: "The official link is broken" },
  { value: "wrong-deadline", label: "The deadline is wrong" },
  { value: "wrong-details", label: "Eligibility or funding is wrong" },
  { value: "looks-fake", label: "This scholarship looks fake" },
  { value: "other", label: "Something else" },
] as const

export type ReportReason = (typeof reportReasons)[number]["value"]

export type ListingReport = {
  reason: ReportReason
  details?: string
}

export async function submitListingReport(scholarshipId: string, report: ListingReport) {
  await apiFetch(`/scholarships/${encodeURIComponent(scholarshipId)}/reports`, {
    method: "POST",
    body: JSON.stringify(report),
  })
}
