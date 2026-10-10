import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { SectionHeading } from "@/components/landing/section-heading"
import { RevealStagger } from "@/components/motion/reveal"
import { ResultCard } from "@/components/scholarship/result-card"
import type { LandingSnapshot } from "@/lib/api/landing"
import { routes } from "@/lib/routes"

type ClosingSoonProps = {
  snapshot: LandingSnapshot
  now: Date
}

export function ClosingSoon({ snapshot, now }: ClosingSoonProps) {
  if (snapshot.closingSoon.length === 0) return null

  return (
    <section aria-labelledby="closing-soon-title" className="container-page py-12 sm:py-16 lg:py-20">
      <SectionHeading
        id="closing-soon-title"
        eyebrow="Live listings"
        title="Closing soon"
        description="The nearest deadlines right now. Each one was opened and checked on the funder's own page."
        action={
          <Link
            href={routes.scholarships}
            className="group inline-flex h-12 shrink-0 items-center gap-1.5 type-button text-teal hover:text-teal-hover sm:h-10"
          >
            See all {snapshot.openCount} places
            <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        }
      />
      <RevealStagger as="ul" className="mt-6 grid gap-3 sm:mt-8 md:grid-cols-3 md:gap-5 lg:mt-10">
        {snapshot.closingSoon.map((scholarship) => (
          <li key={scholarship.id}>
            <ResultCard
              scholarship={scholarship}
              now={now}
              href={routes.scholarship(scholarship.id)}
              compact
              className="h-full"
            />
          </li>
        ))}
      </RevealStagger>
    </section>
  )
}
