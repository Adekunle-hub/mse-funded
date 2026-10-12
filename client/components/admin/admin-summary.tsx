"use client"

import { useQuery } from "@tanstack/react-query"

import { adminApi, type AdminSummary as Summary } from "@/lib/api/admin"
import { queryKeys } from "@/lib/query-keys"

type Stat = { label: string; value: string | number; detail?: string }

function stats(summary: Summary): { title: string; items: Stat[] }[] {
  const { listings, pages, sources, queues, ai } = summary
  return [
    {
      title: "Listings",
      items: [
        { label: "Live on the site", value: listings.live },
        { label: "Under review badge", value: listings.underReview },
        { label: "Held for you to review", value: listings.needsReview },
        { label: "Open reports from users", value: listings.openReports },
      ],
    },
    {
      title: "Pipeline",
      items: [
        { label: "Pages waiting for the AI", value: pages.waiting },
        { label: "Pages that failed", value: pages.failed },
        { label: "Sources with errors", value: sources.withErrors, detail: `of ${sources.active} active` },
      ],
    },
    {
      title: "Jobs and AI use",
      items: [
        { label: "Failed jobs", value: queues.crawl.failed + queues.extract.failed + queues.verify.failed },
        { label: "AI calls today", value: ai.callsToday, detail: `${ai.tokensToday.toLocaleString()} tokens` },
        { label: "AI calls in total", value: ai.callsTotal },
      ],
    },
  ]
}

export function AdminSummary() {
  const summary = useQuery({ queryKey: queryKeys.adminSummary, queryFn: adminApi.summary, refetchInterval: 30_000 })

  if (summary.isPending) return <div aria-hidden="true" className="h-64 rounded-md bg-muted-bg" />
  if (summary.isError)
    return <p className="text-ink-muted">We couldn&apos;t load the numbers. Try again in a moment.</p>

  return (
    <div className="flex flex-col gap-6">
      {stats(summary.data).map((group) => (
        <section key={group.title} aria-labelledby={`admin-${group.title}`}>
          <h2 id={`admin-${group.title}`} className="type-heading-3">
            {group.title}
          </h2>
          <dl className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-3">
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
