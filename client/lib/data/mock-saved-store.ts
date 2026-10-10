import { mockFindScholarship, toSummary } from "@/lib/data/mock-search"
import type { ScholarshipSummary } from "@/lib/types/scholarship"
import type { SavedScholarship, SavedScholarshipUpdate } from "@/lib/types/saved"

const STORAGE_KEY = "msefunded:saved:v1"

function seed(): SavedScholarship[] {
  const entry = (
    id: string,
    rest: Omit<SavedScholarship, "scholarship">
  ): SavedScholarship | null => {
    const detail = mockFindScholarship(id)
    return detail ? { scholarship: toSummary(detail), ...rest } : null
  }

  return [
    entry("leeds-polymer-membranes-phd", {
      status: "applying",
      note: "Asked Dr Okafor for a reference on 2 Oct. Need IELTS certificate by 10 Oct.",
      remindersOn: true,
      savedAt: "2026-09-28T10:00:00Z",
    }),
    entry("daad-advanced-ceramics-msc", {
      status: "interested",
      note: "",
      remindersOn: true,
      savedAt: "2026-10-01T10:00:00Z",
    }),
    entry("manchester-polymer-composites-phd", {
      status: "submitted",
      note: "Interview likely in February. Prepare a 10-minute talk on my B.Eng project.",
      remindersOn: false,
      savedAt: "2026-09-21T10:00:00Z",
      submittedAt: "2026-10-08T10:00:00Z",
    }),
    entry("sheffield-graphene-aerospace-phd", {
      status: "interested",
      note: "",
      remindersOn: false,
      savedAt: "2026-09-01T10:00:00Z",
    }),
  ].filter((item): item is SavedScholarship => item !== null)
}

function read(): SavedScholarship[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as SavedScholarship[]
  } catch {}
  const initial = seed()
  write(initial)
  return initial
}

function write(items: SavedScholarship[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {}
}

export const mockSavedStore = {
  list(): SavedScholarship[] {
    return read()
  },

  save(scholarship: ScholarshipSummary): SavedScholarship {
    const items = read()
    const existing = items.find((item) => item.scholarship.id === scholarship.id)
    if (existing) return existing
    const created: SavedScholarship = {
      scholarship,
      status: "interested",
      note: "",
      remindersOn: true,
      savedAt: new Date().toISOString(),
    }
    write([created, ...items])
    return created
  },

  update(id: string, changes: SavedScholarshipUpdate): SavedScholarship {
    const items = read()
    const index = items.findIndex((item) => item.scholarship.id === id)
    if (index === -1) throw new Error("Not saved")
    const current = items[index]
    const next: SavedScholarship = { ...current, ...changes }
    if (changes.status === "submitted" && current.status !== "submitted") {
      next.submittedAt = new Date().toISOString()
    }
    if (changes.status && changes.status !== "submitted") delete next.submittedAt
    items[index] = next
    write(items)
    return next
  },

  remove(id: string) {
    write(read().filter((item) => item.scholarship.id !== id))
  },

  restore(entry: SavedScholarship) {
    const items = read().filter((item) => item.scholarship.id !== entry.scholarship.id)
    write([entry, ...items])
  },
}
