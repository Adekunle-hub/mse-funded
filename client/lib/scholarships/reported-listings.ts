const STORAGE_KEY = "msefunded:reported"
const listeners = new Set<() => void>()

function readAll(): Record<string, string> {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, string>
  } catch {
    return {}
  }
}

export function reportedAt(scholarshipId: string): string | null {
  return readAll()[scholarshipId] ?? null
}

export function markReported(scholarshipId: string) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...readAll(), [scholarshipId]: new Date().toISOString() })
    )
  } catch {}
  listeners.forEach((listener) => listener())
}

export function subscribeReported(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
