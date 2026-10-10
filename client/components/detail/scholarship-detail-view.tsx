import { notFound } from "next/navigation"
import { Suspense } from "react"

import { ActionCard } from "@/components/detail/action-card"
import { EligibilityList } from "@/components/detail/eligibility-list"
import { HowWeCheck } from "@/components/detail/how-we-check"
import { KeyFacts } from "@/components/detail/key-facts"
import { ListingBanner } from "@/components/detail/listing-banner"
import { MobileActionBar } from "@/components/detail/mobile-action-bar"
import { ReportDialog } from "@/components/detail/report-dialog"
import { SimilarScholarships, SimilarScholarshipsSkeleton } from "@/components/detail/similar-scholarships"
import { DeadlineBadge } from "@/components/scholarship/deadline-badge"
import { TrustLabel } from "@/components/scholarship/trust-label"
import { BackToResults } from "@/components/search/back-to-results"
import { Pill } from "@/components/ui/pill"
import { getScholarship } from "@/lib/api/scholarships"
import { fundingTypeLabels, studyLevelLabels } from "@/lib/scholarships/labels"
import { getRenderTime } from "@/lib/time"
import { cn } from "@/lib/utils"

const LONG_TITLE_LENGTH = 70

type ScholarshipDetailViewProps = {
  params: Promise<{ id: string }>
}

export async function ScholarshipDetailView({ params }: ScholarshipDetailViewProps) {
  const { id } = await params
  const [scholarship, now] = await Promise.all([getScholarship(id), getRenderTime()])
  if (!scholarship) notFound()

  const closed = scholarship.deadline !== null && new Date(scholarship.deadline).getTime() < now.getTime()
  const funderLine = [scholarship.institution, scholarship.department, scholarship.funder]
    .filter(Boolean)
    .join(" · ")

  return (
    <>
      <div className="container-page pt-4 pb-28 sm:pt-6 lg:pb-20">
        <BackToResults className="type-body-sm font-medium text-teal max-lg:hidden" />

        <div className="mt-0 flex flex-col gap-8 lg:mt-6 lg:gap-12 lg:flex-row lg:items-start">
          <article className="min-w-0 max-w-reading flex-7">
            <div className="mb-4">
              <ListingBanner scholarship={scholarship} closed={closed} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Pill tone={closed ? "muted" : "neutral"}>{studyLevelLabels[scholarship.level]}</Pill>
              <Pill tone={closed ? "muted" : "neutral"}>{fundingTypeLabels[scholarship.fundingType]}</Pill>
            </div>
            <h1
              className={cn(
                "mt-3 type-heading-1 text-ink lg:mt-4",
                scholarship.title.length <= LONG_TITLE_LENGTH ? "lg:type-display-3" : "lg:type-heading-1",
                closed && "text-muted-ink"
              )}
            >
              {scholarship.title}
            </h1>
            <p className="mt-2 text-ink-muted lg:mt-3">{funderLine}</p>

            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 type-body-sm lg:mt-4">
              <TrustLabel verification={scholarship.verification} />
              <span className="text-ink-muted max-sm:hidden">· From the official page</span>
            </p>
            <HowWeCheck checkedAt={scholarship.verification.checkedAt} />

            <DeadlineBadge deadline={scholarship.deadline} now={now} size="lg" className="mt-4 lg:hidden" />

            <div className="mt-6 lg:mt-8">
              <KeyFacts scholarship={scholarship} now={now} />
            </div>

            <section aria-labelledby="eligibility-title" className="mt-7 lg:mt-10">
              <h2 id="eligibility-title" className="type-heading-2">
                Who can apply
              </h2>
              <EligibilityList items={scholarship.eligibility} copiedAt={scholarship.verification.checkedAt} />
            </section>

            <section aria-labelledby="about-title" className="mt-7 lg:mt-10">
              <h2 id="about-title" className="type-heading-2">
                About this project
              </h2>
              {scholarship.about.map((paragraph) => (
                <p key={paragraph} className="mt-2 lg:mt-3">
                  {paragraph}
                </p>
              ))}
            </section>

            <section aria-labelledby="apply-title" className="mt-7 lg:mt-10">
              <h2 id="apply-title" className="type-heading-2">
                How to apply
              </h2>
              <ol className="mt-2 flex list-decimal flex-col gap-2 pl-5.5 lg:mt-3">
                {scholarship.howToApply.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="mt-4 max-lg:hidden">
                <a
                  href={scholarship.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-teal underline-offset-4 hover:text-teal-hover hover:underline"
                >
                  Open the official page ↗<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </p>
            </section>

            <div className="mt-8 lg:hidden">
              <ReportDialog scholarshipId={scholarship.id} layout="row" />
            </div>
          </article>

          <aside aria-label="Apply" className="sticky top-24 w-full max-w-105 flex-5 max-lg:hidden">
            <ActionCard scholarship={scholarship} now={now} closed={closed} />
          </aside>
        </div>

        <Suspense fallback={<SimilarScholarshipsSkeleton />}>
          <SimilarScholarships scholarshipId={scholarship.id} />
        </Suspense>
      </div>

      <MobileActionBar scholarship={scholarship} closed={closed} />
    </>
  )
}
