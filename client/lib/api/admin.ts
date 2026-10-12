import { apiFetch } from "@/lib/api/client"

type QueueCounts = { waiting: number; active: number; failed: number; paused: boolean }

export type AdminSummary = {
  listings: { live: number; underReview: number; needsReview: number; openReports: number }
  pages: { waiting: number; failed: number }
  sources: { active: number; withErrors: number }
  queues: { crawl: QueueCounts; extract: QueueCounts; verify: QueueCounts }
  ai: { callsToday: number; callsTotal: number; tokensToday: number }
}

export type HeldListing = {
  id: string
  title: string
  institution: string
  level: "MSC" | "PHD" | "MSC_PHD"
  country: string | null
  fundingType: "FULLY_FUNDED" | "TUITION_ONLY" | "STIPEND_ONLY" | "PARTIAL"
  fundingSummary: string
  openToNigerians: boolean | null
  deadline: string | null
  officialUrl: string | null
  pageUrl: string
  note: string | null
  createdAt: string
}

export type OpenReport = {
  id: string
  reason: string
  details: string | null
  createdAt: string
  scholarship: {
    id: string
    slug: string
    name: string
    institution: string
    officialUrl: string
    deadline: string | null
  }
}

export type ListingStatus = "PUBLISHED" | "UNDER_REVIEW" | "REJECTED" | "DRAFT"

export type AdminListing = {
  id: string
  slug: string
  name: string
  institution: string
  country: string
  status: ListingStatus
  deadline: string | null
  officialUrl: string
  reviewNote: string | null
  verifiedAt: string | null
  openReports: number
}

export type ListingChanges = {
  name?: string
  officialUrl?: string
  deadline?: string | null
  status?: Exclude<ListingStatus, "DRAFT">
}

export type AdminSource = {
  id: string
  name: string
  url: string
  kind: string
  origin: string
  isActive: boolean
  lastStatus: number | null
  lastError: string | null
  lastCrawledAt: string | null
}

export type Page<T> = { items: T[]; total: number; page: number; pageCount: number }

export const adminApi = {
  summary() {
    return apiFetch<AdminSummary>("/admin/summary")
  },

  held() {
    return apiFetch<HeldListing[]>("/admin/review")
  },

  publish(id: string, changes: { officialUrl?: string; deadline?: string | null }) {
    return apiFetch<{ status: string }>(`/admin/review/${id}/publish`, {
      method: "POST",
      body: JSON.stringify(changes),
    })
  },

  reject(id: string) {
    return apiFetch<{ status: string }>(`/admin/review/${id}/reject`, { method: "POST" })
  },

  reports() {
    return apiFetch<OpenReport[]>("/admin/reports")
  },

  resolveReport(id: string) {
    return apiFetch<void>(`/admin/reports/${id}/resolve`, { method: "POST" })
  },

  listings(query: { q: string; status: string; page: number }) {
    return apiFetch<Page<AdminListing>>("/admin/listings", { query })
  },

  updateListing(id: string, changes: ListingChanges) {
    return apiFetch<AdminListing>(`/admin/listings/${id}`, { method: "PATCH", body: JSON.stringify(changes) })
  },

  sources(query: { q: string; problems: boolean; page: number }) {
    return apiFetch<Page<AdminSource>>("/admin/sources", { query })
  },

  addSource(source: { url: string; name?: string; kind: "HTML" | "LISTING" }) {
    return apiFetch<AdminSource>("/admin/sources", { method: "POST", body: JSON.stringify(source) })
  },

  setSourceActive(id: string, isActive: boolean) {
    return apiFetch<AdminSource>(`/admin/sources/${id}`, { method: "PATCH", body: JSON.stringify({ isActive }) })
  },

  retryFailedPages() {
    return apiFetch<{ count: number }>("/admin/pages/retry-failed", { method: "POST" })
  },
}
