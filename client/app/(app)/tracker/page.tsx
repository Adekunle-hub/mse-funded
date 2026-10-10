import type { Metadata } from "next"

import { TrackerView } from "@/components/tracker/tracker-view"

export const metadata: Metadata = {
  title: "Your Scholarships",
  description:
    "Track the funded MSc and PhD places you saved: application status, notes and upcoming deadlines in one place.",
  alternates: { canonical: "/tracker" },
  robots: { index: false, follow: true },
}

export default function TrackerPage() {
  return (
    <div className="container-page pt-4 sm:pt-6 lg:pt-8">
      <h1 className="type-heading-1">
        <span className="sm:hidden">Saved</span>
        <span className="max-sm:hidden">Your Scholarships</span>
      </h1>
      <TrackerView />
    </div>
  )
}
