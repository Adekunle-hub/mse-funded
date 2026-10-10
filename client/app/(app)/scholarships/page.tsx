import type { Metadata } from "next"
import { Suspense } from "react"

import { SearchView } from "@/components/search/search-view"
import { SearchViewSkeleton } from "@/components/search/search-view-skeleton"

const title = "Find funded MSc and PhD scholarships in materials science"
const description =
  "Search funded MSc and PhD places in polymers, metals, ceramics, composites, nanomaterials and corrosion. Filter by level, country, field and funding. Every listing links to the official page."

export const metadata: Metadata = {
  title: "Find scholarships",
  description,
  alternates: { canonical: "/scholarships" },
  openGraph: { url: "/scholarships", title, description },
  twitter: { title, description },
}

export default function ScholarshipsPage({ searchParams }: PageProps<"/scholarships">) {
  return (
    <div className="container-page pt-4 sm:pt-6 lg:pt-8">
      <h1 className="type-heading-1">Find scholarships</h1>
      <p className="mt-1 type-body-sm text-ink-muted">
        Every listing links to an official page and shows the date we last checked it.
      </p>
      <Suspense fallback={<SearchViewSkeleton />}>
        <SearchView searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
