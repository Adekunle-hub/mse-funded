import { cacheLife, cacheTag } from "next/cache"

import { ApiError, apiFetch } from "@/lib/api/client"
import { apiConfig } from "@/lib/api/config"
import { mockScholarships } from "@/lib/data/mock-scholarships"
import { mockCount, mockFindScholarship, mockSearch, mockSimilar } from "@/lib/data/mock-search"
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

  if (apiConfig.useMock) return mockSearch(filters, new Date())
  return apiFetch<SearchResult>("/scholarships", { query: filtersToQuery(filters) })
}

export async function countScholarships(filters: SearchFilters): Promise<number> {
  "use cache"
  cacheLife("minutes")
  cacheTag("scholarships")

  if (apiConfig.useMock) return mockCount(filters, new Date())
  const { total } = await apiFetch<{ total: number }>("/scholarships/count", {
    query: filtersToQuery(filters),
  })
  return total
}

export async function getScholarship(id: string): Promise<ScholarshipDetail | null> {
  "use cache"
  cacheLife("hours")
  cacheTag("scholarships", `scholarship:${id}`)

  if (apiConfig.useMock) return mockFindScholarship(id)
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

  if (apiConfig.useMock) return mockSimilar(id, new Date())
  return apiFetch<ScholarshipSummary[]>(`/scholarships/${encodeURIComponent(id)}/similar`)
}

export async function getPrerenderedScholarshipIds(): Promise<string[]> {
  if (apiConfig.useMock) return mockScholarships.map((item) => item.id)
  const ids = await apiFetch<string[]>("/scholarships/featured-ids").catch(() => [])
  return ids
}
