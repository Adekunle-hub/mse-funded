"use client"

import { useQuery } from "@tanstack/react-query"
import { CirclePause } from "lucide-react"

import { SignInPrompt } from "@/components/auth/sign-in-prompt"
import { useCurrentUser } from "@/hooks/use-auth"
import { getAdminSummary, type AdminSummary as Summary } from "@/lib/api/admin"
import { queryKeys } from "@/lib/query-keys"
import { routes } from "@/lib/routes"

type Stat = { label: string; value: string | number; detail?: string }

function stats(summary: Summary): { title: string; items: Stat[] }[] {
  const { listings, pages, sources, queues, claudeSpend } = summary
  return [
    {
      title: "Listings",
      items: [
        { label: "Live on the site", value: listings.live },
        { label: "Under review badge", value: listings.underReview },
        { label: "Held for you to review", value: listings.needsReview },
      ],
    },
    {
      title: "Pipeline",
      items: [
        { label: "Pages waiting for Claude", value: pages.waiting },
        { label: "Pages that failed", value: pages.failed },
        { label: "Sources with errors", value: sources.withErrors, detail: `of ${sources.active} active` },
      ],
    },
    {
      title: "Jobs and cost",
      items: [
        { label: "Failed jobs", value: queues.crawl.failed + queues.extract.failed + queues.verify.failed },
        { label: "Claude spend today", value: `$${claudeSpend.todayUsd.toFixed(2)}` },
        { label: "Claude spend in total", value: `$${claudeSpend.totalUsd.toFixed(2)}` },
      ],
    },
  ]
}

export function AdminSummary() {
  const { user, isLoading } = useCurrentUser()
  const summary = useQuery({
    queryKey: queryKeys.adminSummary,
    queryFn: getAdminSummary,
    enabled: Boolean(user?.isAdmin),
    refetchInterval: 30_000,
  })

  if (isLoading) return <div aria-hidden="true" className="mt-6 h-64 rounded-md bg-muted-bg" />

  if (!user) {
    return <SignInPrompt title="Log in as an admin" description="This page is only for the people who run MseFunded." next={routes.admin} />
  }

  if (!user.isAdmin) {
    return <p className="mt-6 max-w-reading text-ink-muted">This page is only for the people who run MseFunded.</p>
  }

  if (summary.isPending) return <div aria-hidden="true" className="mt-6 h-64 rounded-md bg-muted-bg" />
  if (summary.isError) return <p className="mt-6 text-ink-muted">We couldn&apos;t load the numbers. Try again in a moment.</p>

  return (
    <div className="mt-6 flex flex-col gap-6">
      {summary.data.queues.extract.paused && (
        <div role="alert" className="flex gap-3 rounded-md border border-amber-ink/30 bg-cream p-4">
          <CirclePause aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-ink" />
          <p>
            Reading pages with Claude is paused, usually because the Anthropic credit ran out. Top up, then run{" "}
            <code className="font-mono">npm run extract</code> in the server folder.
          </p>
        </div>
      )}

      {stats(summary.data).map((group) => (
        <section key={group.title} aria-labelledby={`admin-${group.title}`}>
          <h2 id={`admin-${group.title}`} className="type-heading-3">
            {group.title}
          </h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            {group.items.map((item) => (
              <div key={item.label} className="rounded-md border border-hairline p-4">
                <dt className="type-body-sm text-ink-muted">{item.label}</dt>
                <dd className="mt-1 type-heading-2 tabular-nums">
                  {item.value}
                  {item.detail && <span className="ml-1.5 type-body-sm font-normal text-ink-muted">{item.detail}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
