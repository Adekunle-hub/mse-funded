import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { SampleListing } from "@/components/landing/sample-listing"
import { SectionHeading } from "@/components/landing/section-heading"
import { VerificationCallouts } from "@/components/landing/verification-callouts"
import { Reveal } from "@/components/motion/reveal"
import { routes } from "@/lib/routes"

export function VerificationSection() {
  return (
    <section id="how-we-check" aria-labelledby="how-we-check-title" className="container-page py-12 sm:py-16 lg:py-20">
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
        <div className="lg:col-span-5">
          <SectionHeading
            id="how-we-check-title"
            eyebrow="How we verify"
            title="We open every official page ourselves"
            description="Each listing links to the funder's own website. A person confirms the deadline and eligibility there, then records the date. We re-check open listings every week, and more often near the deadline."
          />
          <Link
            href={routes.howWeCheckDetail}
            className="group mt-5 inline-flex h-12 items-center gap-1.5 type-button text-teal hover:text-teal-hover sm:h-10"
          >
            Read how we check
            <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <Reveal delay={0.1} className="grid gap-5 lg:col-span-7 lg:grid-cols-[minmax(0,1fr)_160px] lg:items-center lg:gap-6">
          <div className="relative">
            <span aria-hidden="true" className="absolute -inset-3 -z-10 rounded-md border border-dashed border-teal/30 bg-mint/20" />
            <SampleListing />
          </div>
          <VerificationCallouts />
        </Reveal>
      </div>
    </section>
  )
}
