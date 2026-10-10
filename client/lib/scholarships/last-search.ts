import { routes } from "@/lib/routes"

const STORAGE_KEY = "msefunded:last-search"
const listeners = new Set<() => void>()

export function rememberLastSearch(href: string) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, href)
    listeners.forEach((listener) => listener())
  } catch {}
}

export function readLastSearch() {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) ?? routes.scholarships
  } catch {
    return routes.scholarships
  }
}

export function subscribeLastSearch(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
