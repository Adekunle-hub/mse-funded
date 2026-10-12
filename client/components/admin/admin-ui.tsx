import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"

export const fieldClass =
  "h-10 w-full rounded-control border border-border-control bg-surface px-3 text-ink outline-none placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"

export function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : ""
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="type-label text-ink">{label}</span>
      {children}
    </label>
  )
}

export function Message({ tone = "muted", children }: { tone?: "muted" | "error"; children: ReactNode }) {
  return <p className={tone === "error" ? "type-body-sm text-error" : "text-ink-muted"}>{children}</p>
}

export function Loading() {
  return <div aria-hidden="true" className="h-48 rounded-md bg-muted-bg" />
}

export function Pager({
  page,
  pageCount,
  onChange,
}: {
  page: number
  pageCount: number
  onChange: (page: number) => void
}) {
  if (pageCount <= 1) return null
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <Button size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      <span className="type-body-sm text-ink-muted tabular-nums">
        Page {page} of {pageCount}
      </span>
      <Button size="sm" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </div>
  )
}
