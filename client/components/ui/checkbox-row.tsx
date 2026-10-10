import { Check } from "lucide-react"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

type CheckboxRowProps = Omit<ComponentProps<"input">, "type"> & {
  label: string
  count?: number
  touch?: boolean
}

export function CheckboxRow({ label, count, touch, className, checked, ...props }: CheckboxRowProps) {
  const empty = count === 0 && !checked

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3",
        touch ? "h-12" : "h-10",
        empty ? "text-muted-ink" : "text-ink",
        className
      )}
    >
      <span className="relative inline-flex size-5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          className="peer size-5 cursor-pointer appearance-none rounded-checkbox border border-border-control bg-surface checked:border-ink checked:bg-ink"
          {...props}
        />
        <Check
          aria-hidden="true"
          className="pointer-events-none absolute inset-0.5 size-4 text-white opacity-0 peer-checked:opacity-100"
        />
      </span>
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className={cn("type-body-sm", empty ? "text-muted-ink" : "text-ink-muted")}>
          {count}
        </span>
      )}
    </label>
  )
}
