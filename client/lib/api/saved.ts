import { apiFetch } from "@/lib/api/client"
import type { SavedScholarship, SavedScholarshipUpdate } from "@/lib/types/saved"

const savedPath = (id: string) => `/me/saved/${encodeURIComponent(id)}`

export const savedApi = {
  list() {
    return apiFetch<SavedScholarship[]>("/me/saved")
  },

  save(id: string) {
    return apiFetch<SavedScholarship>(savedPath(id), { method: "PUT" })
  },

  update(id: string, changes: SavedScholarshipUpdate) {
    return apiFetch<SavedScholarship>(savedPath(id), { method: "PATCH", body: JSON.stringify(changes) })
  },

  remove(id: string) {
    return apiFetch<void>(savedPath(id), { method: "DELETE" })
  },

  restore(entry: SavedScholarship) {
    const { status, note, remindersOn } = entry
    return apiFetch<SavedScholarship>(savedPath(entry.scholarship.id), {
      method: "PUT",
      body: JSON.stringify({ status, note, remindersOn }),
    })
  },
}
