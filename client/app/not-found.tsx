import type { Metadata } from "next"
import Link from "next/link"
import { Search } from "lucide-react"

import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { buttonVariants } from "@/components/ui/button"
import { routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page doesn't exist or has moved. Search checked, funded MSE places instead.",
  robots: { index: false },
}

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1 bg-graph-paper">
        <section
          aria-labelledby="not-found-title"
          className="mx-auto max-w-hero px-4 pt-10 pb-12 text-center sm:px-6 sm:pt-16 sm:pb-16 lg:py-24"
        >
          <p className="type-label text-ink-muted">Error 404</p>
          <h1 id="not-found-title" className="mt-4 type-display-3 text-balance text-ink lg:type-display-2">
            We couldn&apos;t find that page.
          </h1>
          <p className="mx-auto mt-5 max-w-140 type-body-lg text-ink-muted">
            The link may be old, or the page may have moved. Every scholarship we list is still one
            search away.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4 lg:mt-10">
            <Link
              href={routes.scholarships}
              data-primary-cta
              className={cn(buttonVariants({ variant: "primary", size: "lg" }), "max-sm:w-full")}
            >
              <Search aria-hidden="true" className="max-sm:hidden" />
              Find scholarships
            </Link>
            <Link
              href={routes.home}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "max-sm:w-full")}
            >
              Go to the home page
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
