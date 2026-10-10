import type { Metadata } from "next"
import { Suspense } from "react"

import { DetailSkeleton } from "@/components/detail/detail-skeleton"
import { ScholarshipDetailView } from "@/components/detail/scholarship-detail-view"
import { getPrerenderedScholarshipIds, getScholarship } from "@/lib/api/scholarships"
import { formatDate } from "@/lib/format/date"
import { routes } from "@/lib/routes"
import { studyLevelLabels } from "@/lib/scholarships/labels"

export async function generateStaticParams() {
  const ids = await getPrerenderedScholarshipIds()
  return ids.map((id) => ({ id }))
}

export async function generateMetadata({ params }: PageProps<"/scholarships/[id]">): Promise<Metadata> {
  const { id } = await params
  const scholarship = await getScholarship(id)
  if (!scholarship) return { title: "Scholarship not found", robots: { index: false } }

  const title = `${scholarship.title}, ${scholarship.institution}`
  const description = `${studyLevelLabels[scholarship.level]} in ${scholarship.fields.join(", ").toLowerCase()} at ${scholarship.institution}, ${scholarship.country}. ${scholarship.fundingSummary}. Deadline ${formatDate(scholarship.deadline)}. Official link, checked eligibility and deadline.`
  const url = routes.scholarship(scholarship.id)

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", url, title, description },
    twitter: { title, description },
  }
}

export default function ScholarshipPage({ params }: PageProps<"/scholarships/[id]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ScholarshipDetailView params={params} />
    </Suspense>
  )
}
