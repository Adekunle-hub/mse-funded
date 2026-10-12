"use client"

import { ArrowUp, FileText, Paperclip, Square, X } from "lucide-react"
import { useRef, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react"

import { Button } from "@/components/ui/button"

const MAX_FILE_BYTES = 5_000_000

type ComposerProps = {
  text: string
  file: File | null
  streaming: boolean
  disabled: boolean
  onTextChange: (text: string) => void
  onFileChange: (file: File | null, error?: string) => void
  onSend: () => void
  onStop: () => void
}

export function Composer({
  text,
  file,
  streaming,
  disabled,
  onTextChange,
  onFileChange,
  onSend,
  onStop,
}: ComposerProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const canSend = !disabled && !streaming && text.trim().length > 0

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (canSend) onSend()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      if (canSend) onSend()
    }
  }

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0] ?? null
    event.target.value = ""
    if (!chosen) return
    if (chosen.size > MAX_FILE_BYTES) return onFileChange(null, "Attach a file under 5 MB")
    if (!/\.(pdf|txt|md)$/i.test(chosen.name))
      return onFileChange(null, "Attach a PDF or a .txt file. Save Word files as PDF first.")
    onFileChange(chosen)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border border-border-control bg-surface p-2 shadow-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink"
    >
      {file && (
        <div className="m-1 mb-2 inline-flex max-w-full items-center gap-2 rounded-md bg-muted-bg py-1.5 pr-1.5 pl-2.5 type-body-sm">
          <FileText aria-hidden="true" className="size-4 shrink-0 text-teal" />
          <span className="truncate">{file.name}</span>
          <button
            type="button"
            onClick={() => onFileChange(null)}
            className="inline-flex size-6 cursor-pointer items-center justify-center rounded hover:bg-surface"
          >
            <X aria-hidden="true" className="size-3.5" />
            <span className="sr-only">Remove {file.name}</span>
          </button>
        </div>
      )}
      <label className="sr-only" htmlFor="assistant-message">
        Message MseFunded AI
      </label>
      <textarea
        id="assistant-message"
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        maxLength={8000}
        placeholder="Ask about materials science, or attach your CV or SOP for a review…"
        className="field-sizing-content max-h-60 min-h-12 w-full resize-none bg-transparent px-2 py-1.5 text-ink outline-none placeholder:text-ink-muted"
      />
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => fileInput.current?.click()} disabled={streaming}>
          <Paperclip aria-hidden="true" />
          Attach CV or SOP
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.txt,.md"
          onChange={handleFile}
          className="sr-only"
          tabIndex={-1}
        />
        {streaming ? (
          <Button type="button" size="sm" onClick={onStop}>
            <Square aria-hidden="true" className="fill-current" />
            Stop
          </Button>
        ) : (
          <Button type="submit" variant="primary" size="sm" disabled={!canSend}>
            <ArrowUp aria-hidden="true" />
            Send
          </Button>
        )}
      </div>
    </form>
  )
}
