"use client"

import { useEffect } from "react"

import { Wordmark } from "@/components/brand/wordmark"
import { ErrorState } from "@/components/feedback/error-state"

export default function ErrorPage({
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
    <>
      <header className="h-16 border-b border-hairline lg:h-18">
        <div className="container-page flex h-full items-center">
          <Wordmark />
        </div>
      </header>
      <main id="main" className="flex-1">
        <ErrorState digest={error.digest} onRetry={retry} />
      </main>
    </>
  )
}
