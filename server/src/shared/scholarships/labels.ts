import type { FundingType, StudyLevel } from "../types/scholarship.js"

export const studyLevelLabels: Record<StudyLevel, string> = {
  msc: "MSc",
  phd: "PhD",
  "msc-phd": "MSc + PhD",
}

export const fundingTypeLabels: Record<FundingType, string> = {
  "fully-funded": "Fully funded",
  "tuition-only": "Tuition only",
  "stipend-only": "Stipend only",
  partial: "Partial",
}
