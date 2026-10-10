"use client"

import { motion } from "motion/react"
import { Bookmark } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useSavedEntry, useToggleSave } from "@/hooks/use-saved"
import type { ScholarshipSummary } from "@/lib/types/scholarship"
import { cn } from "@/lib/utils"

type SaveButtonProps = {
  scholarship: ScholarshipSummary
  layout?: "card" | "block" | "bar"
  className?: string
}

const layoutClasses = {
  card: "size-12 px-0 sm:h-10 sm:w-auto sm:px-4",
  block: "w-full",
  bar: "size-14 px-0",
}

export function SaveButton({ scholarship, layout = "card", className }: SaveButtonProps) {
  const { entry, isPending } = useSavedEntry(scholarship.id)
  const toggle = useToggleSave()
  const saved = Boolean(entry)
  const label = saved ? "Saved" : "Save"
  const showsText = layout === "block"

  return (
    <Button
      variant="outline"
      aria-pressed={saved}
      aria-label={showsText ? undefined : saved ? `Saved: ${scholarship.title}` : `Save ${scholarship.title}`}
      onClick={() => {
        if (!isPending) toggle.mutate({ scholarship, save: !saved })
      }}
      className={cn(layoutClasses[layout], className)}
    >
      <motion.span
        key={saved ? "saved" : "unsaved"}
        initial={saved ? { scale: 0.4, rotate: -20 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 14 }}
        className="flex"
      >
        <Bookmark aria-hidden="true" className={cn(saved && "fill-teal text-teal")} />
      </motion.span>
      <span className={cn(layout === "card" && "max-sm:sr-only", layout === "bar" && "sr-only")}>
        {label}
      </span>
    </Button>
  )
}
