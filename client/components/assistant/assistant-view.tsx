"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Atom, Briefcase, FileText, History, PenLine, Sparkles } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { ChatList } from "@/components/assistant/chat-list"
import { ChatMarkdown } from "@/components/assistant/chat-markdown"
import { Composer } from "@/components/assistant/composer"
import { SignInPrompt } from "@/components/auth/sign-in-prompt"
import { UserAvatar } from "@/components/auth/user-avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useCurrentUser } from "@/hooks/use-auth"
import { assistantApi, type ChatMessage } from "@/lib/api/assistant"
import type { User } from "@/lib/api/auth"
import { queryKeys } from "@/lib/query-keys"
import { routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

const suggestions = [
  {
    icon: Atom,
    title: "Explain a concept",
    prompt: "Explain the iron–carbon phase diagram and how cooling rate decides the final microstructure of steel.",
  },
  {
    icon: FileText,
    title: "Review my CV",
    prompt: "Please review my CV for a funded MSc in materials science. I have attached it.",
  },
  {
    icon: PenLine,
    title: "Improve my SOP",
    prompt:
      "Please review my statement of purpose for a PhD in materials science and tell me how to make it stronger. I have attached it.",
  },
  {
    icon: Briefcase,
    title: "Plan my career",
    prompt:
      "What career paths can I build with a materials science and engineering degree in Nigeria, and which skills should I learn first?",
  },
]

type ShownMessage = ChatMessage & { pending?: boolean }

function AssistantMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-md bg-teal text-white", className)}>
      <Sparkles aria-hidden="true" className="size-4" />
    </span>
  )
}

function MessageRow({ message, user }: { message: ShownMessage; user: User }) {
  if (message.role === "user") {
    return (
      <li className="flex justify-end gap-3">
        <div className="flex max-w-[85%] flex-col items-end gap-1.5">
          {message.attachmentName && (
            <span className="inline-flex max-w-full items-center gap-2 rounded-md border border-hairline bg-surface px-2.5 py-1.5 type-body-sm">
              <FileText aria-hidden="true" className="size-4 shrink-0 text-teal" />
              <span className="truncate">{message.attachmentName}</span>
            </span>
          )}
          <div className="rounded-md bg-mint/60 px-4 py-2.5 whitespace-pre-wrap text-ink">{message.content}</div>
        </div>
        <UserAvatar name={user.name} imageUrl={user.avatarUrl} size={32} className="max-sm:hidden" />
      </li>
    )
  }

  return (
    <li className="flex gap-3">
      <AssistantMark className="size-8" />
      <div className="min-w-0 flex-1 pt-1">
        {message.content ? (
          <ChatMarkdown text={message.content} />
        ) : (
          <span aria-label="Thinking" className="inline-flex gap-1 pt-2">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="size-1.5 animate-pulse rounded-full bg-ink-muted"
                style={{ animationDelay: `${dot * 0.2}s` }}
              />
            ))}
          </span>
        )}
      </div>
    </li>
  )
}

export function AssistantView() {
  const { user, isLoading } = useCurrentUser()
  const queryClient = useQueryClient()
  const chats = useQuery({ queryKey: queryKeys.assistantChats, queryFn: assistantApi.list, enabled: Boolean(user) })

  const [chatId, setChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ShownMessage[]>([])
  const [text, setText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listOpen, setListOpen] = useState(false)
  const abort = useRef<AbortController | null>(null)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (streaming) end.current?.scrollIntoView({ block: "end" })
  }, [messages, streaming])

  if (isLoading) return <div aria-hidden="true" className="mt-6 h-96 rounded-md bg-muted-bg" />

  if (!user) {
    return (
      <SignInPrompt
        title="Log in to ask MseFunded AI"
        description="Your materials science expert: ask any MSE question, get your CV or SOP reviewed and plan your career. It is free."
        next={routes.assistant}
      />
    )
  }

  const refreshChats = () => queryClient.invalidateQueries({ queryKey: queryKeys.assistantChats })
  const messagesLeft = chats.data?.messagesLeft
  const outOfMessages = messagesLeft === 0

  const startNew = () => {
    setChatId(null)
    setMessages([])
    setError(null)
    setListOpen(false)
  }

  const openChat = async (id: string) => {
    setListOpen(false)
    setOpening(true)
    setError(null)
    try {
      const chat = await assistantApi.open(id)
      setChatId(chat.id)
      setMessages(chat.messages)
    } catch {
      setError("We couldn't open that chat. Try again.")
    } finally {
      setOpening(false)
    }
  }

  const deleteChat = async (id: string) => {
    if (!window.confirm("Delete this chat? This cannot be undone.")) return
    await assistantApi.remove(id).catch(() => undefined)
    if (id === chatId) startNew()
    await refreshChats()
  }

  const send = async () => {
    const message = text.trim()
    const attachment = file
    setError(null)
    setText("")
    setFile(null)
    setStreaming(true)
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", content: message, attachmentName: attachment?.name ?? null },
      { id: "reply", role: "model", content: "", attachmentName: null, pending: true },
    ])

    const controller = new AbortController()
    abort.current = controller
    try {
      const id = chatId ?? (await assistantApi.start(message)).id
      setChatId(id)
      await assistantApi.send(
        id,
        message,
        attachment,
        (chunk) =>
          setMessages((current) =>
            current.map((item) => (item.id === "reply" ? { ...item, content: item.content + chunk } : item))
          ),
        controller.signal
      )
    } catch (problem) {
      if (!controller.signal.aborted) {
        setError(problem instanceof Error ? problem.message : "Something went wrong. Try again.")
        setMessages((current) => current.filter((item) => item.id !== "reply" || item.content))
      }
    } finally {
      setMessages((current) =>
        current.map((item) => (item.id === "reply" ? { ...item, id: `model-${Date.now()}`, pending: false } : item))
      )
      setStreaming(false)
      abort.current = null
      await refreshChats()
    }
  }

  const list = (
    <ChatList
      chats={chats.data?.conversations ?? []}
      activeId={chatId}
      disabled={streaming || opening}
      onNew={startNew}
      onOpen={openChat}
      onDelete={deleteChat}
    />
  )

  return (
    <div className="mt-4 grid gap-6 lg:mt-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="max-lg:hidden">
        <div className="sticky top-24">{list}</div>
      </aside>

      <section aria-label="Chat" className="flex min-h-[60dvh] min-w-0 flex-col">
        <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
          <Sheet open={listOpen} onOpenChange={setListOpen}>
            <SheetTrigger render={<Button variant="outline" size="sm" />}>
              <History aria-hidden="true" />
              Your chats
            </SheetTrigger>
            <SheetContent side="left" className="w-80 max-w-[85vw] overflow-y-auto p-4 pt-14">
              <SheetTitle className="sr-only">Your chats</SheetTitle>
              {list}
            </SheetContent>
          </Sheet>
          {chatId && (
            <Button variant="ghost" size="sm" onClick={startNew} disabled={streaming}>
              New chat
            </Button>
          )}
        </div>

        {opening ? (
          <div aria-hidden="true" className="h-64 rounded-md bg-muted-bg" />
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center py-6">
            <AssistantMark className="size-11 [&_svg]:size-5" />
            <h2 className="mt-4 type-heading-2">Hi {user.name.split(" ")[0]}, what can I help with?</h2>
            <p className="mt-2 max-w-reading text-ink-muted">
              I&apos;m MseFunded AI, a materials science and engineering expert. Ask me about any MSE topic, attach your
              CV or statement of purpose for a detailed review, or plan your next career step.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {suggestions.map(({ icon: Icon, title, prompt }) => (
                <li key={title}>
                  <button
                    type="button"
                    onClick={() => setText(prompt)}
                    className="flex h-full w-full cursor-pointer flex-col gap-2 rounded-md border border-hairline p-4 text-left transition-colors hover:border-border-control hover:bg-muted-bg/50"
                  >
                    <span className="inline-flex items-center gap-2 type-label text-ink">
                      <Icon aria-hidden="true" className="size-4 text-teal" />
                      {title}
                    </span>
                    <span className="type-body-sm text-ink-muted">{prompt}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ol aria-live="polite" className="flex flex-1 flex-col gap-6 pb-6">
            {messages.map((message) => (
              <MessageRow key={message.id} message={message} user={user} />
            ))}
          </ol>
        )}
        <div ref={end} />

        <div className="sticky bottom-16 bg-surface pt-2 pb-3 lg:bottom-0 lg:pb-6">
          {error && <p className="mb-2 type-body-sm text-error">{error}</p>}
          <Composer
            text={text}
            file={file}
            streaming={streaming}
            disabled={outOfMessages || opening}
            onTextChange={setText}
            onFileChange={(chosen, problem) => {
              setFile(chosen)
              setError(problem ?? null)
            }}
            onSend={send}
            onStop={() => abort.current?.abort()}
          />
          <p className="mt-2 type-caption text-ink-muted">
            {outOfMessages
              ? "You have used today's messages. Come back tomorrow."
              : messagesLeft !== undefined && `${messagesLeft} of ${chats.data?.dailyLimit} messages left today. `}
            MseFunded AI can make mistakes. Check important facts and confirm scholarship details on official pages.
          </p>
        </div>
      </section>
    </div>
  )
}
