import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"

import { CountUp } from "@/components/landing/count-up"
import { HeroBackdrop } from "@/components/landing/hero-backdrop"
import { LatticeField } from "@/components/landing/lattice-field"
import { Magnetic } from "@/components/motion/magnetic"
import { WordRotator } from "@/components/landing/word-rotator"
import { DeadlineBadge } from "@/components/scholarship/deadline-badge"
import { buttonVariants } from "@/components/ui/button"
import type { LandingSnapshot } from "@/lib/api/landing"
import { routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

const disciplines = ["polymer science", "ceramics", "metallurgy", "composites", "nanomaterials", "corrosion"]

type HeroProps = {
  snapshot: LandingSnapshot
  now: Date
}

export function Hero({ snapshot, now }: HeroProps) {
  const stats = [
    { value: snapshot.openCount, label: "Open funded places" },
    { value: snapshot.institutionCount, label: "Universities and founders" },
    { value: snapshot.countryCount, label: "Countries" },
  ]
  const next = snapshot.nextDeadline

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden border-b border-hairline bg-surface">
      <HeroBackdrop>
        <LatticeField id="hero-lattice" className="size-full" />
      </HeroBackdrop>

      <div className="container-page pt-10 pb-8 text-center sm:pt-16 lg:pt-20 lg:pb-12">
        <p className="hero-in inline-flex items-center gap-2 rounded-md border border-hairline bg-surface/90 px-3 py-1.5 type-label text-ink">
          <span className="live-dot size-2 rounded-[2px] bg-teal" />
          Every listing from an official page
          <span className="font-normal text-ink-muted">· updated daily</span>
        </p>

        <h1
          id="hero-title"
          className="hero-in mx-auto mt-5 max-w-hero type-display-3 text-balance text-ink [animation-delay:80ms] sm:type-display-2 lg:max-w-none lg:type-display-1 lg:text-wrap"
        >
          <span className="lg:block">Funded MSc and PhD places.</span>{" "}
          <span className="lg:block">
            Every link <span className="text-teal">checked.</span>
          </span>
        </h1>

        <p className="hero-in mx-auto mt-4 max-w-150 type-body-lg text-ink-muted [animation-delay:160ms] lg:mt-6">
          For students and graduates in{" "}
          <WordRotator words={disciplines} className="font-medium text-ink" />
          <br className="max-sm:hidden" /> Real openings with official links, checked deadlines and clear eligibility.
        </p>

        <div className="hero-in mt-6 flex flex-col gap-2.5 [animation-delay:240ms] sm:flex-row sm:justify-center sm:gap-3 lg:mt-9">
          <Magnetic>
            <Link
              href={routes.scholarships}
              data-primary-cta
              className={cn(buttonVariants({ variant: "primary", size: "lg" }), "group max-sm:w-full")}
            >
              <Search aria-hidden="true" />
              Find scholarships
              <ArrowRight aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </Magnetic>
          <Magnetic strength={0.18}>
            <Link
              href="#how-we-check"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-surface/90 max-sm:w-full")}
            >
              How we check
            </Link>
          </Magnetic>
        </div>
        <p className="hero-in mt-3 type-body-sm text-ink-muted [animation-delay:280ms]">Free for students. No card needed.</p>

        <div className="hero-in mx-auto mt-8 grid max-w-215 grid-cols-3 overflow-hidden rounded-md border border-hairline bg-surface/90 text-left [animation-delay:340ms] sm:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.6fr)] lg:mt-14">
          {stats.map((stat) => (
            <div key={stat.label} className="border-r border-hairline px-3 py-3 max-sm:nth-3:border-r-0 sm:px-5 sm:py-4">
              <p className="text-[22px] leading-7 font-semibold tracking-[-0.02em] text-ink sm:text-[28px] sm:leading-9">
                <CountUp value={stat.value} />
              </p>
              <p className="type-body-sm text-ink-muted">{stat.label}</p>
            </div>
          ))}
          {next && (
            <Link
              href={routes.scholarship(next.scholarship.id)}
              className="group col-span-3 flex flex-col justify-center gap-1.5 border-t border-hairline px-4 py-3 transition-colors duration-150 hover:bg-muted-bg sm:col-span-1 sm:border-t-0 sm:px-5 sm:py-4"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="type-label text-ink-muted">Next deadline</span>
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 text-ink-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink"
                />
              </span>
              <span className="truncate type-label text-ink">{next.scholarship.title}</span>
              <DeadlineBadge deadline={next.scholarship.deadline} now={now} />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
