"use client"

import { CircleAlert } from "lucide-react"
import { useId, useState, type ComponentProps, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type TextFieldProps = Omit<ComponentProps<"input">, "id"> & {
  label: string
  error?: string
  hint?: string
  labelAside?: ReactNode
}

export function TextField({ label, error, hint, labelAside, className, type, ...props }: TextFieldProps) {
  const id = useId()
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === "password"
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="type-label text-ink">
          {label}
        </label>
        {labelAside}
      </div>
      <div
        className={cn(
          "flex h-12 items-center gap-2 rounded-control border bg-surface pl-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink",
          error ? "border-error" : "border-border-control",
          isPassword ? "pr-1" : "pr-4"
        )}
      >
        <input
          id={id}
          type={isPassword && revealed ? "text" : type}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className="h-full min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-muted"
          {...props}
        />
        {isPassword && (
          <Button
            type="button"
            variant="text"
            size="inline"
            className="h-12 px-3"
            aria-pressed={revealed}
            onClick={() => setRevealed((value) => !value)}
          >
            {revealed ? "Hide" : "Show"}
            <span className="sr-only"> password</span>
          </Button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1.5 type-body-sm text-error">
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="type-body-sm text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  )
}
