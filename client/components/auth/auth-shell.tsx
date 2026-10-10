import Link from "next/link"
import type { ReactNode } from "react"

import { Wordmark } from "@/components/brand/wordmark"

type AuthShellProps = {
  title: string
  subtitle?: string
  switchPrompt: string
  switchLabel: string
  switchHref: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthShell({ title, subtitle, switchPrompt, switchLabel, switchHref, children, footer }: AuthShellProps) {
  const switchLink = (
    <Link href={switchHref} className="font-medium text-teal underline-offset-4 hover:underline">
      {switchLabel}
    </Link>
  )

  return (
    <div className="flex min-h-dvh flex-col sm:bg-graph-paper">
      <header className="h-16 border-b border-hairline bg-surface sm:h-18 sm:border-0 sm:bg-transparent">
        <div className="container-page flex h-full items-center justify-between">
          <Wordmark />
          <p className="type-body-sm text-ink-muted max-sm:hidden">
            {switchPrompt} {switchLink}
          </p>
        </div>
      </header>

      <main id="main" className="flex-1 px-4 pt-6 pb-12 sm:pt-16 sm:pb-20">
        <div className="mx-auto flex w-full max-w-auth flex-col gap-5 sm:rounded-card sm:border sm:border-hairline sm:bg-surface sm:p-10">
          <div className="sm:text-center">
            <h1 className="type-heading-1 sm:type-display-3">{title}</h1>
            {subtitle && <p className="mt-2 text-ink-muted sm:mt-3">{subtitle}</p>}
          </div>
          {children}
          {footer}
          <p className="text-center type-body-sm text-ink-muted sm:hidden">
            {switchPrompt} {switchLink}
          </p>
        </div>
      </main>
    </div>
  )
}
