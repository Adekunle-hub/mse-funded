"use client"

import { useEffect } from "react"

import { ErrorState } from "@/components/feedback/error-state"
import { fontVariables } from "@/lib/fonts"
import "./globals.css"

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en-GB" className={fontVariables}>
      <body className="flex min-h-dvh flex-col">
        <title>Something went wrong · MseFunded</title>
        <main id="main" className="flex-1">
          <ErrorState digest={error.digest} onRetry={retry} />
        </main>
      </body>
    </html>
  )
}
