"use client"

import { CircleAlert } from "lucide-react"
import { useEffect, useRef } from "react"

export function FormAlert({ message }: { message: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [message])

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="flex gap-2 rounded-control border border-error bg-error-bg p-3 type-body-sm text-ink"
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-error" />
      {message}
    </div>
  )
}
