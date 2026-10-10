"use client"

import type { ReactNode } from "react"

import { ToastProvider } from "@/components/feedback/toast"
import { QueryProvider } from "@/components/providers/query-provider"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ToastProvider>{children}</ToastProvider>
    </QueryProvider>
  )
}
