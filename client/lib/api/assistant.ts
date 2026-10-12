import { apiFetch, apiStream } from "@/lib/api/client"

export type ChatSummary = { id: string; title: string; updatedAt: string }

export type ChatMessage = {
  id: string
  role: "user" | "model"
  content: string
  attachmentName: string | null
}

export type ChatList = { conversations: ChatSummary[]; messagesLeft: number; dailyLimit: number }

export const assistantApi = {
  list() {
    return apiFetch<ChatList>("/assistant/conversations")
  },

  open(id: string) {
    return apiFetch<{ id: string; title: string; messages: ChatMessage[] }>(`/assistant/conversations/${id}`)
  },

  start(message: string) {
    return apiFetch<ChatSummary>("/assistant/conversations", { method: "POST", body: JSON.stringify({ message }) })
  },

  remove(id: string) {
    return apiFetch<void>(`/assistant/conversations/${id}`, { method: "DELETE" })
  },

  send(id: string, message: string, file: File | null, onText: (text: string) => void, signal: AbortSignal) {
    const form = new FormData()
    form.append("message", message)
    if (file) form.append("file", file)
    return apiStream(`/assistant/conversations/${id}/messages`, { method: "POST", body: form, signal }, onText)
  },
}
