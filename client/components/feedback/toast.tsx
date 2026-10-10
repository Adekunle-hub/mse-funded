"use client"

import { Bookmark, CircleAlert, CircleCheck } from "lucide-react"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ToastTone = "saved" | "success" | "error"

type ToastOptions = {
  message: string
  tone?: ToastTone
  action?: { label: string; onClick: () => void }
}

type ActiveToast = ToastOptions & { id: number }

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null)

const TOAST_DURATION_MS = 5000

const toneIcons = {
  saved: <Bookmark aria-hidden="true" className="fill-teal text-teal" />,
  success: <CircleCheck aria-hidden="true" className="text-teal" />,
  error: <CircleAlert aria-hidden="true" className="text-error" />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null)
  const [paused, setPaused] = useState(false)
  const nextId = useRef(0)

  const show = useCallback((options: ToastOptions) => {
    nextId.current += 1
    setToast({ ...options, id: nextId.current })
  }, [])

  useEffect(() => {
    if (!toast || paused) return
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [toast, paused])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 lg:bottom-6"
      >
        {toast && (
          <div
            key={toast.id}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            className={cn(
              "pointer-events-auto flex max-w-md items-center gap-3 rounded-control border border-hairline bg-surface py-2 pr-2 pl-4 type-body-sm text-ink",
              "animate-in fade-in-0 duration-150"
            )}
          >
            {toneIcons[toast.tone ?? "success"]}
            <span className="py-1.5">{toast.message}</span>
            {toast.action && (
              <Button
                variant="text"
                size="inline"
                className="h-10 px-2"
                onClick={() => {
                  toast.action?.onClick()
                  setToast(null)
                }}
              >
                {toast.action.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const show = useContext(ToastContext)
  if (!show) throw new Error("useToast must be used inside ToastProvider")
  return show
}
