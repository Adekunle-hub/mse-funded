"use client"

import { Search } from "lucide-react"
import { useState } from "react"

import { useSearchController } from "@/components/search/search-controller"
import { Button } from "@/components/ui/button"

export function SearchBar() {
  const { filters, update } = useSearchController()
  const [query, setQuery] = useState(filters.q)

  return (
    <form
      role="search"
      className="flex gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        update({ ...filters, q: query.trim(), page: 1 })
      }}
    >
      <label className="flex h-12 flex-1 items-center gap-3 rounded-control border border-border-control bg-surface px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink lg:h-14">
        <Search aria-hidden="true" className="size-5 shrink-0 text-ink" />
        <span className="sr-only">Search scholarships</span>
        <input
          type="search"
          name="q"
          enterKeyHint="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by topic, university or funder"
          className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-muted"
        />
      </label>
      <Button type="submit" variant="primary" size="lg" className="max-lg:hidden">
        Search
      </Button>
    </form>
  )
}
