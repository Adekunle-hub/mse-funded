import type { Metadata } from "next"

import { ClosingSoon } from "@/components/landing/closing-soon"
import { DeadlineCalendar } from "@/components/landing/deadline-calendar"
import { Faq } from "@/components/landing/faq"
import { FieldExplorer } from "@/components/landing/field-explorer"
import { FinalCta } from "@/components/landing/final-cta"
import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { MsePrimer } from "@/components/landing/mse-primer"
import { VerificationSection } from "@/components/landing/verification-section"
import { getLandingSnapshot } from "@/lib/api/landing"
import { siteConfig } from "@/lib/site-config"
import { getRenderTime } from "@/lib/time"

const title = "Funded MSc and PhD places for materials science students"
const description =
  "Find fully funded MSc and PhD places in polymers, ceramics, metallurgy, composites, nanomaterials and corrosion. Every listing links to the official page, with a checked deadline and clear eligibility. Free for students."

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} · ${title}` },
  description,
  alternates: { canonical: "/" },
  openGraph: { url: "/", title, description },
  twitter: { title, description },
}

export default async function HomePage() {
  const [snapshot, now] = await Promise.all([getLandingSnapshot(), getRenderTime()])

  return (
    <>
      <Hero snapshot={snapshot} now={now} />
      <ClosingSoon snapshot={snapshot} now={now} />
      <FieldExplorer snapshot={snapshot} />
      <VerificationSection example={snapshot.example} now={now} />
      <MsePrimer />
      <HowItWorks />
      <DeadlineCalendar snapshot={snapshot} />
      <Faq />
      <FinalCta openCount={snapshot.openCount} />
    </>
  )
}
