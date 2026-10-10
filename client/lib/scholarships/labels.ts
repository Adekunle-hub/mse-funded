import type { FundingType, StudyLevel } from "@/lib/types/scholarship"

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
