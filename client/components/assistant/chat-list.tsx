"use client"

import { MessageSquare, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ChatSummary } from "@/lib/api/assistant"
import { formatDate } from "@/lib/format/date"
import { cn } from "@/lib/utils"

type ChatListProps = {
  chats: ChatSummary[]
  activeId: string | null
  disabled: boolean
  onNew: () => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}

export function ChatList({ chats, activeId, disabled, onNew, onOpen, onDelete }: ChatListProps) {
  return (
    <div className="flex flex-col gap-4">
      <Button variant="primary" onClick={onNew} disabled={disabled} className="w-full">
        <Plus aria-hidden="true" />
        New chat
      </Button>
      <div>
        <h2 className="px-1 type-label text-ink-muted">Your chats</h2>
        {chats.length === 0 ? (
          <p className="mt-2 px-1 type-body-sm text-ink-muted">Your conversations will be saved here.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {chats.map((chat) => (
              <li key={chat.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onOpen(chat.id)}
                  disabled={disabled}
                  aria-current={chat.id === activeId ? "true" : undefined}
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-2.5 rounded-md py-2 pr-9 pl-2.5 text-left hover:bg-muted-bg disabled:cursor-not-allowed",
                    chat.id === activeId && "bg-mint/60 hover:bg-mint/60"
                  )}
                >
                  <MessageSquare aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-muted" />
                  <span className="min-w-0">
                    <span className="block truncate type-body-sm font-medium text-ink">{chat.title}</span>
                    <span className="block type-caption text-ink-muted">
                      {formatDate(chat.updatedAt, { withYear: false })}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(chat.id)}
                  disabled={disabled}
                  className="absolute top-2 right-1.5 inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-ink-muted opacity-100 hover:bg-surface hover:text-error lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  <span className="sr-only">Delete {chat.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
