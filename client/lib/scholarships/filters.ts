import { fundingTypeLabels, studyLevelLabels } from "@/lib/scholarships/labels"
import type { FundingType, StudyLevel } from "@/lib/types/scholarship"
import type { DeadlineWindow, MultiFilterKey, SearchFilters, SortOption } from "@/lib/types/search"

export const SEARCH_PAGE_SIZE = 10

export const fieldOptions = ["Polymers", "Ceramics", "Metals", "Nanomaterials", "Composites", "Corrosion"]

export const deadlineOptions: { value: DeadlineWindow; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "30d", label: "Next 30 days" },
  { value: "1-3m", label: "1–3 months" },
  { value: "3m+", label: "3+ months" },
]

export const sortOptions: { value: SortOption; label: string; shortLabel: string }[] = [
  { value: "deadline", label: "Deadline, soonest first", shortLabel: "Deadline" },
  { value: "verified", label: "Recently verified", shortLabel: "Verified" },
  { value: "newest", label: "Newest added", shortLabel: "Newest" },
]

export const filterGroupLabels: Record<MultiFilterKey, string> = {
  level: "Level",
  country: "Country",
  field: "Field",
  funding: "Funding type",
}

const levels = Object.keys(studyLevelLabels) as StudyLevel[]
const fundingTypes = Object.keys(fundingTypeLabels) as FundingType[]

export const defaultFilters: SearchFilters = {
  q: "",
  level: [],
  country: [],
  field: [],
  funding: [],
  deadline: "any",
  sort: "deadline",
  page: 1,
}

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>

function readAll(source: ParamSource, key: string): string[] {
  if (source instanceof URLSearchParams) return source.getAll(key)
  const value = source[key]
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

function readOne(source: ParamSource, key: string) {
  return readAll(source, key)[0]
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

export function parseSearchFilters(source: ParamSource): SearchFilters {
  const page = Number.parseInt(readOne(source, "page") ?? "1", 10)
  return {
    q: (readOne(source, "q") ?? "").trim().slice(0, 120),
    level: readAll(source, "level").filter((value): value is StudyLevel => levels.includes(value as StudyLevel)),
    country: readAll(source, "country").filter(Boolean),
    field: readAll(source, "field").filter(Boolean),
    funding: readAll(source, "funding").filter((value): value is FundingType =>
      fundingTypes.includes(value as FundingType)
    ),
    deadline: oneOf(readOne(source, "deadline"), deadlineOptions.map((o) => o.value), "any"),
    sort: oneOf(readOne(source, "sort"), sortOptions.map((o) => o.value), "deadline"),
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 1000) : 1,
  }
}

export function toSearchParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q) params.set("q", filters.q)
  for (const key of ["level", "country", "field", "funding"] as const) {
    for (const value of filters[key]) params.append(key, value)
  }
  if (filters.deadline !== "any") params.set("deadline", filters.deadline)
  if (filters.sort !== "deadline") params.set("sort", filters.sort)
  if (filters.page > 1) params.set("page", String(filters.page))
  return params
}

export function searchHref(filters: SearchFilters) {
  const query = toSearchParams(filters).toString()
  return query ? `/scholarships?${query}` : "/scholarships"
}

export function activeFilterCount(filters: SearchFilters) {
  return (
    filters.level.length +
    filters.country.length +
    filters.field.length +
    filters.funding.length +
    (filters.deadline === "any" ? 0 : 1)
  )
}

export function optionLabel(key: MultiFilterKey, value: string) {
  if (key === "level") return studyLevelLabels[value as StudyLevel] ?? value
  if (key === "funding") return fundingTypeLabels[value as FundingType] ?? value
  return value
}

export function deadlineLabel(value: DeadlineWindow) {
  return deadlineOptions.find((option) => option.value === value)?.label ?? value
}

export function clearFilters(filters: SearchFilters): SearchFilters {
  return { ...defaultFilters, q: filters.q, sort: filters.sort }
}
