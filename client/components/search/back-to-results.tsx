"use client"

import Link from "next/link"
import { useSyncExternalStore } from "react"
import { ArrowLeft } from "lucide-react"

import { readLastSearch, subscribeLastSearch } from "@/lib/scholarships/last-search"
import { routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

type BackToResultsProps = {
  label?: string
  className?: string
}

export function BackToResults({ label = "Back to results", className }: BackToResultsProps) {
  const href = useSyncExternalStore(subscribeLastSearch, readLastSearch, () => routes.scholarships)

  return (
    <Link href={href} className={cn("inline-flex items-center gap-2", className)}>
      <ArrowLeft aria-hidden="true" className="size-5 shrink-0" />
      {label}
    </Link>
  )
}
