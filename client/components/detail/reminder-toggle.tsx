"use client"

import { Mail } from "lucide-react"
import { useId } from "react"

import { useSavedEntry, useUpdateSaved } from "@/hooks/use-saved"
import { cn } from "@/lib/utils"

export function ReminderToggle({ scholarshipId }: { scholarshipId: string }) {
  const { entry } = useSavedEntry(scholarshipId)
  const update = useUpdateSaved()
  const labelId = useId()
  if (!entry) return null

  const on = entry.remindersOn

  return (
    <div className="flex items-center gap-3">
      <Mail aria-hidden="true" className="size-5 shrink-0" />
      <span id={labelId} className="flex-1 type-body-sm">
        Email reminders 7, 3 and 1 day before
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={labelId}
        onClick={() => update.mutate({ id: scholarshipId, changes: { remindersOn: !on } })}
        className={cn(
          "relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-md transition-colors duration-150 after:absolute after:top-[3px] after:size-[18px] after:rounded-md after:bg-white after:transition-[left] after:duration-150",
          on ? "bg-teal after:left-[19px]" : "bg-border-control after:left-[3px]"
        )}
      />
    </div>
  )
}
