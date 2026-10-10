"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react"

import { rememberLastSearch } from "@/lib/scholarships/last-search"
import { parseSearchFilters, searchHref } from "@/lib/scholarships/filters"
import type { SearchFilters } from "@/lib/types/search"

const FILTER_DEBOUNCE_MS = 300

type SearchControllerValue = {
  filters: SearchFilters
  isPending: boolean
  update: (next: SearchFilters, options?: { debounce?: boolean }) => void
}

const SearchControllerContext = createContext<SearchControllerValue | null>(null)

export function SearchController({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryString = searchParams.toString()
  const [isPending, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const committed = useMemo(() => parseSearchFilters(new URLSearchParams(queryString)), [queryString])
  const [draft, setDraft] = useState(committed)
  const [syncedQuery, setSyncedQuery] = useState(queryString)

  if (syncedQuery !== queryString) {
    setSyncedQuery(queryString)
    setDraft(committed)
  }

  useEffect(() => {
    rememberLastSearch(queryString ? `${pathname}?${queryString}` : pathname)
  }, [pathname, queryString])

  useEffect(() => () => clearTimeout(timer.current), [])

  const update = useCallback(
    (next: SearchFilters, { debounce = false }: { debounce?: boolean } = {}) => {
      setDraft(next)
      clearTimeout(timer.current)
      const navigate = () =>
        startTransition(() => router.replace(searchHref(next), { scroll: false }))
      if (debounce) timer.current = setTimeout(navigate, FILTER_DEBOUNCE_MS)
      else navigate()
    },
    [router]
  )

  const value = useMemo(() => ({ filters: draft, isPending, update }), [draft, isPending, update])

  return <SearchControllerContext.Provider value={value}>{children}</SearchControllerContext.Provider>
}

export function useSearchController() {
  const value = useContext(SearchControllerContext)
  if (!value) throw new Error("useSearchController must be used inside SearchController")
  return value
}
