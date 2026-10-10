"use client"

import { ChevronDown } from "lucide-react"
import { useId, useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"

type FilterGroupProps = {
  title: string
  summary?: string
  defaultOpen?: boolean
  children: ReactNode
}

export function FilterGroup({ title, summary, defaultOpen = true, children }: FilterGroupProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <fieldset className="border-t border-hairline py-2 first:border-t-0">
      <legend className="sr-only">{title}</legend>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-12 w-full items-center justify-between gap-3 text-left type-label text-ink"
      >
        <span>{title}</span>
        <span className="inline-flex items-center gap-2">
          {!open && summary && <span className="type-body-sm text-ink-muted">{summary}</span>}
          <ChevronDown
            aria-hidden="true"
            className={cn("size-4 transition-transform duration-200", open && "rotate-180")}
          />
        </span>
      </button>
      <div id={panelId} hidden={!open} className="pb-2">
        {children}
      </div>
    </fieldset>
  )
}
