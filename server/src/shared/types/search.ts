import type { FundingType, ScholarshipSummary, StudyLevel } from "./scholarship.js"

export type DeadlineWindow = "any" | "30d" | "1-3m" | "3m+"

export type SortOption = "deadline" | "verified" | "newest"

export type SearchFilters = {
  q: string
  level: StudyLevel[]
  country: string[]
  field: string[]
  funding: FundingType[]
  deadline: DeadlineWindow
  sort: SortOption
  page: number
}

export type MultiFilterKey = "level" | "country" | "field" | "funding"

export type FacetOption = {
  value: string
  label: string
  count: number
}

export type SearchFacets = Record<MultiFilterKey, FacetOption[]>

export type FilterSuggestion = {
  key: MultiFilterKey | "deadline"
  value: string
  label: string
  count: number
}

export type SearchResult = {
  items: ScholarshipSummary[]
  total: number
  pageSize: number
  facets: SearchFacets
  suggestions: FilterSuggestion[]
}
