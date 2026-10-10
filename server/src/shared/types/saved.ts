import type { ScholarshipSummary } from "./scholarship.js"

export type ApplicationStatus = "interested" | "applying" | "submitted"

export type SavedScholarship = {
  scholarship: ScholarshipSummary
  status: ApplicationStatus
  note: string
  remindersOn: boolean
  savedAt: string
  submittedAt?: string
}

export type SavedScholarshipUpdate = Partial<Pick<SavedScholarship, "status" | "note" | "remindersOn">>
