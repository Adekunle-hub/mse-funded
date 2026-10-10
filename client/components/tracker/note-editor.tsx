"use client"

import { useEffect, useId, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { useUpdateSaved } from "@/hooks/use-saved"
import { cn } from "@/lib/utils"

const AUTOSAVE_DELAY_MS = 800

type NoteEditorProps = {
  scholarshipId: string
  note: string
}

export function NoteEditor({ scholarshipId, note }: NoteEditorProps) {
  const update = useUpdateSaved()
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState(note)
  const [savedVisible, setSavedVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const textareaId = useId()

  useEffect(() => () => clearTimeout(timer.current), [])

  const save = (value: string) => {
    if (value.trim() === note.trim()) return
    update.mutate(
      { id: scholarshipId, changes: { note: value.trim() } },
      { onSuccess: () => setSavedVisible(true) }
    )
  }

  const handleChange = (value: string) => {
    setDraft(value)
    setSavedVisible(false)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => save(value), AUTOSAVE_DELAY_MS)
  }

  const finish = () => {
    clearTimeout(timer.current)
    save(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={textareaId} className="type-label text-ink-muted">
          Notes
        </label>
        <textarea
          id={textareaId}
          autoFocus
          rows={3}
          value={draft}
          maxLength={2000}
          onChange={(event) => handleChange(event.target.value)}
          onBlur={finish}
          onKeyDown={(event) => {
            if (event.key === "Escape") finish()
          }}
          className="min-h-[5.5rem] resize-y rounded-control border border-border-control px-4 py-3 text-ink"
        />
        <p aria-live="polite" className="min-h-[18px] type-caption text-ink-muted">
          {update.isPending ? "Saving…" : savedVisible ? "Saved" : ""}
        </p>
      </div>
    )
  }

  if (!note) {
    return (
      <Button variant="text" size="inline" className="h-10" onClick={() => setEditing(true)}>
        + Add a note
      </Button>
    )
  }

  return (
    <div>
      <p className="type-label text-ink-muted">Notes</p>
      <button
        type="button"
        onClick={() => {
          setDraft(note)
          setEditing(true)
        }}
        className={cn(
          "mt-1 block w-full cursor-text text-left text-ink",
          !expanded && "max-sm:truncate"
        )}
      >
        <span className="sr-only">Edit note: </span>
        {note}
      </button>
      {!expanded && (
        <Button variant="text" size="inline" className="h-10 sm:hidden" onClick={() => setExpanded(true)}>
          More
        </Button>
      )}
    </div>
  )
}
