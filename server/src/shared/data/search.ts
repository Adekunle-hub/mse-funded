import { calendarDaysBetween } from "../format/date.js"
import {
  deadlineLabel,
  fieldOptions,
  optionLabel,
  SEARCH_PAGE_SIZE,
} from "../scholarships/filters.js"
import { fundingTypeLabels, studyLevelLabels } from "../scholarships/labels.js"
import { toSummaryFromDetail } from "../scholarships/summary.js"
import type { ScholarshipDetail, ScholarshipSummary } from "../types/scholarship.js"
import type {
  FacetOption,
  FilterSuggestion,
  MultiFilterKey,
  SearchFilters,
  SearchResult,
} from "../types/search.js"

type FilterKey = MultiFilterKey | "deadline" | "q"

export const toSummary = toSummaryFromDetail

function deadlineTime(item: ScholarshipSummary) {
  return item.deadline ? new Date(item.deadline).getTime() : Number.POSITIVE_INFINITY
}

function isOpen(item: ScholarshipSummary, now: Date) {
  return deadlineTime(item) >= now.getTime()
}

function matchesWindow(item: ScholarshipSummary, window: SearchFilters["deadline"], now: Date) {
  if (window === "any") return true
  if (!item.deadline) return false
  const days = calendarDaysBetween(now, new Date(item.deadline))
  if (window === "30d") return days <= 30
  if (window === "1-3m") return days > 30 && days <= 92
  return days > 92
}

function matchesQuery(item: ScholarshipSummary, q: string) {
  if (!q) return true
  const haystack = [item.title, item.institution, item.funder, item.country, ...item.fields]
    .join(" ")
    .toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((term) => haystack.includes(term))
}

function matches(item: ScholarshipSummary, filters: SearchFilters, now: Date, except?: FilterKey) {
  const check = (key: FilterKey, ok: boolean) => except === key || ok
  return (
    isOpen(item, now) &&
    check("q", matchesQuery(item, filters.q)) &&
    check("level", filters.level.length === 0 || filters.level.includes(item.level)) &&
    check("country", filters.country.length === 0 || filters.country.includes(item.country)) &&
    check("field", filters.field.length === 0 || item.fields.some((f) => filters.field.includes(f))) &&
    check("funding", filters.funding.length === 0 || filters.funding.includes(item.fundingType)) &&
    check("deadline", matchesWindow(item, filters.deadline, now))
  )
}

const valueOf: Record<MultiFilterKey, (item: ScholarshipSummary) => string[]> = {
  level: (item) => [item.level],
  country: (item) => [item.country],
  field: (item) => item.fields,
  funding: (item) => [item.fundingType],
}

function facetFor(key: MultiFilterKey, pool: ScholarshipSummary[], filters: SearchFilters, now: Date) {
  const candidates = pool.filter((item) => matches(item, filters, now, key))
  const counts = new Map<string, number>()
  for (const item of candidates) {
    for (const value of valueOf[key](item)) counts.set(value, (counts.get(value) ?? 0) + 1)
  }

  const baseValues: Record<MultiFilterKey, string[]> = {
    level: Object.keys(studyLevelLabels),
    field: fieldOptions,
    funding: Object.keys(fundingTypeLabels),
    country: [...new Set(pool.map((item) => item.country))],
  }

  const options: FacetOption[] = baseValues[key].map((value) => ({
    value,
    label: optionLabel(key, value),
    count: counts.get(value) ?? 0,
  }))

  if (key === "country") {
    options.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  }
  return options
}

function sortItems(items: ScholarshipSummary[], sort: SearchFilters["sort"]) {
  const time = (value: string) => new Date(value).getTime()
  const flaggedLast = (a: ScholarshipSummary, b: ScholarshipSummary) =>
    Number(a.verification.status === "under-review") - Number(b.verification.status === "under-review")

  return [...items].sort((a, b) => {
    if (sort === "verified") return time(b.verification.checkedAt) - time(a.verification.checkedAt)
    if (sort === "newest") return time(b.addedAt) - time(a.addedAt)
    return deadlineTime(a) - deadlineTime(b) || flaggedLast(a, b)
  })
}

function suggestionsFor(pool: ScholarshipSummary[], filters: SearchFilters, now: Date) {
  const suggestions: FilterSuggestion[] = []
  const countWithout = (next: SearchFilters) => pool.filter((item) => matches(item, next, now)).length

  for (const key of ["level", "country", "field", "funding"] as const) {
    for (const value of filters[key]) {
      const next = { ...filters, [key]: filters[key].filter((v) => v !== value) }
      const count = countWithout(next)
      if (count > 0) suggestions.push({ key, value, label: optionLabel(key, value), count })
    }
  }
  if (filters.deadline !== "any") {
    const count = countWithout({ ...filters, deadline: "any" })
    if (count > 0) {
      suggestions.push({ key: "deadline", value: filters.deadline, label: deadlineLabel(filters.deadline), count })
    }
  }
  return suggestions.sort((a, b) => b.count - a.count).slice(0, 3)
}

export function searchListings(listings: ScholarshipDetail[], filters: SearchFilters, now: Date): SearchResult {
  const pool = listings.map(toSummary)
  const matched = sortItems(
    pool.filter((item) => matches(item, filters, now)),
    filters.sort
  )

  const pageCount = Math.max(1, Math.ceil(matched.length / SEARCH_PAGE_SIZE))
  const page = Math.min(filters.page, pageCount)

  return {
    items: matched.slice((page - 1) * SEARCH_PAGE_SIZE, page * SEARCH_PAGE_SIZE),
    total: matched.length,
    page,
    pageCount,
    pageSize: SEARCH_PAGE_SIZE,
    facets: {
      level: facetFor("level", pool, filters, now),
      country: facetFor("country", pool, filters, now),
      field: facetFor("field", pool, filters, now),
      funding: facetFor("funding", pool, filters, now),
    },
    suggestions: matched.length === 0 ? suggestionsFor(pool, filters, now) : [],
  }
}

export function openListings(listings: ScholarshipDetail[], now: Date) {
  return sortItems(listings.map(toSummary).filter((item) => isOpen(item, now)), "deadline")
}

export function countListings(listings: ScholarshipDetail[], filters: SearchFilters, now: Date) {
  return listings.map(toSummary).filter((item) => matches(item, filters, now)).length
}

export function findListing(listings: ScholarshipDetail[], id: string) {
  return listings.find((item) => item.id === id) ?? null
}

export function similarListings(listings: ScholarshipDetail[], id: string, now: Date, limit = 3) {
  const current = findListing(listings, id)
  if (!current) return []
  const score = (item: ScholarshipDetail) =>
    item.fields.filter((field) => current.fields.includes(field)).length * 2 +
    Number(item.level === current.level)

  return listings
    .filter((item) => item.id !== id && isOpen(item, now) && score(item) > 0)
    .sort((a, b) => score(b) - score(a) || deadlineTime(a) - deadlineTime(b))
    .slice(0, limit)
    .map(toSummary)
}

