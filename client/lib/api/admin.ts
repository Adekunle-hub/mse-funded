import { apiFetch } from "@/lib/api/client"

type QueueCounts = { waiting: number; active: number; failed: number; paused: boolean }

export type AdminSummary = {
  listings: { live: number; underReview: number; needsReview: number }
  pages: { waiting: number; failed: number }
  sources: { active: number; withErrors: number }
  queues: { crawl: QueueCounts; extract: QueueCounts; verify: QueueCounts }
  claudeSpend: { todayUsd: number; totalUsd: number }
}

export function getAdminSummary(): Promise<AdminSummary> {
  return apiFetch<AdminSummary>("/admin/summary")
}
