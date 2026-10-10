import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { LatticeField } from "@/components/landing/lattice-field"
import { Magnetic } from "@/components/motion/magnetic"
import { Reveal } from "@/components/motion/reveal"
import { buttonVariants } from "@/components/ui/button"
import { routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

export function FinalCta({ openCount }: { openCount: number }) {
  return (
    <section aria-labelledby="final-cta-title" className="container-page pb-12 sm:pb-16 lg:pb-20">
      <Reveal className="relative isolate overflow-hidden rounded-md border border-hairline bg-mint/40 px-4 py-10 text-center sm:px-10 sm:py-12 lg:py-16">
        <LatticeField id="cta-lattice" animated={false} className="absolute inset-0 -z-10 size-full opacity-70" />
        <h2 id="final-cta-title" className="mx-auto max-w-180 type-display-3 text-balance text-ink lg:type-display-2">
          {openCount} funded places are open right now.
        </h2>
        <p className="mx-auto mt-3 max-w-130 type-body-lg text-ink-muted">
          Each one links to the official page, with a deadline a person has checked.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Magnetic>
            <Link
              href={routes.scholarships}
              data-primary-cta
              className={cn(buttonVariants({ variant: "primary", size: "lg" }), "group max-sm:w-full")}
            >
              Find scholarships
              <ArrowRight aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </Magnetic>
          <Magnetic strength={0.18}>
            <Link href={routes.signup} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-surface max-sm:w-full")}>
              Create a free account
            </Link>
          </Magnetic>
        </div>
      </Reveal>
    </section>
  )
}
