export type StudyLevel = "msc" | "phd" | "msc-phd"

export type FundingType =
  | "fully-funded"
  | "tuition-only"
  | "stipend-only"
  | "partial"

export type VerificationStatus = "verified" | "under-review"

export type Verification = {
  status: VerificationStatus
  checkedAt: string
  note?: string
}

export type DeadlineZone = {
  id: string
  label: string
}

export type ScholarshipSummary = {
  id: string
  title: string
  level: StudyLevel
  fundingType: FundingType
  institution: string
  funder: string
  country: string
  fields: string[]
  fundingSummary: string
  deadline: string
  deadlineZone: DeadlineZone
  officialUrl: string
  addedAt: string
  verification: Verification
}

export type ScholarshipDetail = ScholarshipSummary & {
  department?: string
  city: string
  durationLabel: string
  fundingCovers: string
  startDate: string
  openTo: string
  eligibility: string[]
  about: string[]
  howToApply: string[]
}
