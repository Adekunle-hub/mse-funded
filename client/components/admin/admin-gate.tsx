"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { SignInPrompt } from "@/components/auth/sign-in-prompt"
import { useCurrentUser } from "@/hooks/use-auth"
import { adminApi } from "@/lib/api/admin"
import { queryKeys } from "@/lib/query-keys"
import { routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

const tabs = [
  { label: "Overview", href: routes.admin, count: null },
  { label: "Review", href: routes.adminReview, count: "needsReview" },
  { label: "Reports", href: routes.adminReports, count: "openReports" },
  { label: "Listings", href: routes.adminListings, count: null },
  { label: "Sources", href: routes.adminSources, count: null },
] as const

function AdminTabs() {
  const pathname = usePathname()
  const summary = useQuery({ queryKey: queryKeys.adminSummary, queryFn: adminApi.summary, refetchInterval: 30_000 })

  return (
    <nav aria-label="Admin sections" className="mt-4 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-1 border-b border-hairline">
        {tabs.map((tab) => {
          const active = pathname === tab.href
          const count = tab.count ? summary.data?.listings[tab.count] : 0
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex h-11 items-center gap-2 border-b-2 px-3 type-label whitespace-nowrap",
                  active ? "border-teal text-ink" : "border-transparent text-ink-muted hover:text-ink"
                )}
              >
                {tab.label}
                {Boolean(count) && (
                  <span className="rounded-full bg-amber-bg px-2 py-0.5 type-body-sm text-amber-ink tabular-nums">
                    {count}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function AdminGate({ children }: { children: ReactNode }) {
  const { user, isLoading } = useCurrentUser()

  if (isLoading) return <div aria-hidden="true" className="mt-6 h-64 rounded-md bg-muted-bg" />

  if (!user) {
    return (
      <SignInPrompt
        title="Log in as an admin"
        description="This page is only for the people who run MseFunded."
        next={routes.admin}
      />
    )
  }

  if (!user.isAdmin) {
    return <p className="mt-6 max-w-reading text-ink-muted">This page is only for the people who run MseFunded.</p>
  }

  return (
    <>
      <AdminTabs />
      <div className="mt-6">{children}</div>
    </>
  )
}
