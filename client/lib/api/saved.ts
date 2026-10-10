import { apiFetch } from "@/lib/api/client"
import { apiConfig } from "@/lib/api/config"
import { mockSavedStore } from "@/lib/data/mock-saved-store"
import type { ScholarshipSummary } from "@/lib/types/scholarship"
import type { SavedScholarship, SavedScholarshipUpdate } from "@/lib/types/saved"

const withSession = { credentials: "include" } as const
const json = (body: unknown) => ({
  ...withSession,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

export const savedApi = {
  list(): Promise<SavedScholarship[]> {
    if (apiConfig.useMock) return Promise.resolve(mockSavedStore.list())
    return apiFetch("/me/saved", withSession)
  },

  save(scholarship: ScholarshipSummary): Promise<SavedScholarship> {
    if (apiConfig.useMock) return Promise.resolve(mockSavedStore.save(scholarship))
    return apiFetch(`/me/saved/${encodeURIComponent(scholarship.id)}`, { method: "PUT", ...withSession })
  },

  update(id: string, changes: SavedScholarshipUpdate): Promise<SavedScholarship> {
    if (apiConfig.useMock) return Promise.resolve(mockSavedStore.update(id, changes))
    return apiFetch(`/me/saved/${encodeURIComponent(id)}`, { method: "PATCH", ...json(changes) })
  },

  remove(id: string): Promise<void> {
    if (apiConfig.useMock) return Promise.resolve(mockSavedStore.remove(id))
    return apiFetch(`/me/saved/${encodeURIComponent(id)}`, { method: "DELETE", ...withSession })
  },

  restore(entry: SavedScholarship): Promise<void> {
    if (apiConfig.useMock) return Promise.resolve(mockSavedStore.restore(entry))
    return apiFetch(`/me/saved/${encodeURIComponent(entry.scholarship.id)}`, {
      method: "PUT",
      ...json({ status: entry.status, note: entry.note, remindersOn: entry.remindersOn }),
    })
  },
}
