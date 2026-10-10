import { cacheLife, cacheTag } from "next/cache"

import { ApiError, apiFetch } from "@/lib/api/client"
import { toSearchParams } from "@/lib/scholarships/filters"
import type { ScholarshipDetail, ScholarshipSummary } from "@/lib/types/scholarship"
import type { SearchFilters, SearchResult } from "@/lib/types/search"

function filtersToQuery(filters: SearchFilters) {
  const params = toSearchParams(filters)
  const query: Record<string, string[]> = {}
  for (const key of new Set(params.keys())) query[key] = params.getAll(key)
  return query
}

export async function searchScholarships(filters: SearchFilters): Promise<SearchResult> {
  "use cache"
  cacheLife("minutes")
  cacheTag("scholarships")

  return apiFetch<SearchResult>("/scholarships", { query: filtersToQuery(filters) })
}

export async function countScholarships(filters: SearchFilters): Promise<number> {
  "use cache"
  cacheLife("minutes")
  cacheTag("scholarships")

  const { total } = await apiFetch<{ total: number }>("/scholarships/count", { query: filtersToQuery(filters) })
  return total
}

export async function getScholarship(id: string): Promise<ScholarshipDetail | null> {
  "use cache"
  cacheLife("hours")
  cacheTag("scholarships", `scholarship:${id}`)

  try {
    return await apiFetch<ScholarshipDetail>(`/scholarships/${encodeURIComponent(id)}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function getSimilarScholarships(id: string): Promise<ScholarshipSummary[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("scholarships", `scholarship:${id}`)

  return apiFetch<ScholarshipSummary[]>(`/scholarships/${encodeURIComponent(id)}/similar`)
}

export async function getPrerenderedScholarshipIds(): Promise<string[]> {
  return apiFetch<string[]>("/scholarships/featured-ids")
}
