import { BellOff, CircleAlert } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { buttonVariants } from "@/components/ui/button"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Reminders stopped",
  robots: { index: false, follow: false },
}

async function StopResult({ searchParams }: { searchParams: PageProps<"/reminders-stopped">["searchParams"] }) {
  const invalid = (await searchParams).invalid === "1"
  const Icon = invalid ? CircleAlert : BellOff

  return (
    <div className="mt-6 flex max-w-reading flex-col items-start gap-4 rounded-md border border-hairline p-6">
      <Icon aria-hidden="true" className="size-6 text-teal" />
      <p>
        {invalid
          ? "This link didn't work. You can turn reminders on or off for each scholarship in your saved list."
          : "We won't send any more reminders for this scholarship. You can turn them back on in your saved list."}
      </p>
      <Link href={routes.tracker} className={buttonVariants({ variant: "outline" })}>
        Open your saved scholarships
      </Link>
    </div>
  )
}

export default function RemindersStoppedPage({ searchParams }: PageProps<"/reminders-stopped">) {
  return (
    <div className="container-page pt-4 sm:pt-6 lg:pt-8">
      <h1 className="type-heading-1">Reminders</h1>
      <Suspense>
        <StopResult searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
