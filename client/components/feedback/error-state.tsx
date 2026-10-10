"use client"

import Link from "next/link"
import { CircleAlert, RotateCcw } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { routes } from "@/lib/routes"

type ErrorStateProps = {
  digest?: string
  onRetry: () => void
}

export function ErrorState({ digest, onRetry }: ErrorStateProps) {
  return (
    <section
      aria-labelledby="error-title"
      className="mx-auto w-full max-w-reading px-4 py-16 sm:px-6 lg:py-24"
    >
      <div role="alert" className="flex gap-4 rounded-card border border-hairline bg-error-bg p-6">
        <CircleAlert aria-hidden="true" className="size-6 shrink-0 text-error" />
        <div>
          <h1 id="error-title" className="type-heading-2 text-ink">
            Something went wrong on our side.
          </h1>
          <p className="mt-2 text-ink-muted">
            Your saved list and filters are safe. Try again, or come back in a few minutes.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button variant="primary" onClick={onRetry}>
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>
            <Link href={routes.home} className={buttonVariants({ variant: "outline" })}>
              Go to the home page
            </Link>
          </div>
          {digest && (
            <p className="mt-4 type-caption text-ink-muted">
              If this keeps happening, tell us this reference: <span className="font-mono">{digest}</span>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
