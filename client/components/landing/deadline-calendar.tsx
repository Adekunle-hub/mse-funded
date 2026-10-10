import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { DeadlineBars } from "@/components/landing/deadline-bars"
import { Reveal } from "@/components/motion/reveal"
import type { LandingSnapshot } from "@/lib/api/landing"
import { defaultFilters, searchHref } from "@/lib/scholarships/filters"

export function DeadlineCalendar({ snapshot }: { snapshot: LandingSnapshot }) {
  const months = snapshot.deadlinesByMonth
  const busiest = months.reduce((top, month) => (month.count > top.count ? month : top), months[0])

  return (
    <section aria-labelledby="calendar-title" className="border-y border-hairline bg-ink text-white">
      <div className="container-page grid gap-8 py-12 sm:gap-10 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-end lg:gap-16 lg:py-20">
        <Reveal>
          <p className="inline-flex items-center gap-2 type-label tracking-[0.08em] text-mint uppercase">
            <span aria-hidden="true" className="h-px w-6 bg-mint" />
            Plan your year
          </p>
          <h2 id="calendar-title" className="mt-3 type-display-3 text-balance lg:type-display-2">
            When deadlines fall
          </h2>
          <p className="mt-3 max-w-120 type-body-lg text-white/75">
            Open listings by deadline month. References, transcripts and English test results take weeks to arrange, so
            start well before the month your deadline falls in.
          </p>
          <Link
            href={searchHref({ ...defaultFilters, deadline: "30d" })}
            className="group mt-6 inline-flex h-12 items-center gap-1.5 type-button text-mint hover:text-white sm:h-10"
          >
            See what closes in the next 30 days
            <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </Reveal>

        <figure>
          <DeadlineBars months={months} busiestKey={busiest?.key} />
          <figcaption className="mt-4 flex flex-wrap gap-x-5 gap-y-2 type-body-sm text-white/70">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="size-2.5 rounded-[2px] bg-pink" /> This month
            </span>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="size-2.5 rounded-[2px] bg-mint" /> Busiest month
            </span>
            <span>{snapshot.openCount} open places in total</span>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
