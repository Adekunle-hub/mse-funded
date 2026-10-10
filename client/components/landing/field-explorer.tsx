import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { FieldArt } from "@/components/landing/field-art"
import { SectionHeading } from "@/components/landing/section-heading"
import { RevealStagger } from "@/components/motion/reveal"
import { TiltCard } from "@/components/motion/tilt-card"
import { fieldGuide } from "@/content/landing"
import type { LandingSnapshot } from "@/lib/api/landing"
import { defaultFilters, searchHref } from "@/lib/scholarships/filters"
import { cn } from "@/lib/utils"

const tints = ["bg-mint/50", "bg-cream", "bg-pink/40"]

export function FieldExplorer({ snapshot }: { snapshot: LandingSnapshot }) {
  return (
    <section aria-labelledby="fields-title" className="border-y border-hairline bg-cream/40 py-12 sm:py-16 lg:py-20">
      <div className="container-page">
        <SectionHeading
          id="fields-title"
          eyebrow="Explore by field"
          title="Find your corner of materials science"
          description="From polymer chains to corrosion pits. Pick your field to see what is funded right now."
        />
        <RevealStagger as="ul" className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-5">
          {fieldGuide.map((field, index) => {
            const count = snapshot.fieldCounts[field.name] ?? 0
            return (
              <li key={field.name}>
                <TiltCard>
                <Link
                  href={searchHref({ ...defaultFilters, field: [field.name] })}
                  className="group flex h-full flex-col overflow-hidden rounded-md border border-hairline bg-surface transition-colors duration-150 hover:border-border-control"
                >
                  <div className={cn("relative h-24 overflow-hidden border-b border-hairline sm:h-32", tints[index % tints.length])}>
                    <FieldArt field={field.name} />
                  </div>
                  <div className="flex flex-1 flex-col p-3.5 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="type-heading-3 text-ink">{field.title}</h3>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-4 shrink-0 text-ink-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-teal"
                      />
                    </div>
                    <p className="mt-1.5 text-ink-muted">{field.description}</p>
                    <p className="mt-auto flex items-center gap-2 pt-3 type-label sm:pt-4 text-ink">
                      <span
                        aria-hidden="true"
                        className={cn("size-1.5 rounded-[1px]", count > 0 ? "bg-teal" : "bg-border-control")}
                      />
                      {count > 0 ? `${count} open ${count === 1 ? "place" : "places"}` : "None open right now"}
                    </p>
                  </div>
                </Link>
                </TiltCard>
              </li>
            )
          })}
        </RevealStagger>
      </div>
    </section>
  )
}
