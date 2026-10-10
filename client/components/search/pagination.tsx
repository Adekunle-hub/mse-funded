import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { searchHref } from "@/lib/scholarships/filters"
import type { SearchFilters } from "@/lib/types/search"
import { cn } from "@/lib/utils"

type PaginationProps = {
  filters: SearchFilters
  page: number
  pageCount: number
}

type PageItem = number | "gap"

function pageItems(page: number, pageCount: number): PageItem[] {
  const pages = [...new Set([1, page - 1, page, page + 1, pageCount])]
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((a, b) => a - b)

  return pages.flatMap((value, index) => {
    const previous = pages[index - 1]
    return previous !== undefined && value - previous > 1 ? ["gap" as const, value] : [value]
  })
}

function StepLink({ href, direction }: { href: string | null; direction: "previous" | "next" }) {
  const label = direction === "previous" ? "Previous" : "Next"
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight
  const className = cn(buttonVariants({ variant: "outline" }), "gap-1.5", !href && "pointer-events-none opacity-40")

  const content = (
    <>
      {direction === "previous" && <Icon aria-hidden="true" className="size-4" />}
      {label}
      {direction === "next" && <Icon aria-hidden="true" className="size-4" />}
    </>
  )

  return href ? (
    <Link href={href} rel={direction === "previous" ? "prev" : "next"} className={className}>
      {content}
    </Link>
  ) : (
    <span aria-disabled="true" className={className}>
      {content}
    </span>
  )
}

export function Pagination({ filters, page, pageCount }: PaginationProps) {
  if (pageCount <= 1) return null
  const href = (target: number) => searchHref({ ...filters, page: target })

  return (
    <nav aria-label="Pagination" className="mt-2 flex items-center justify-between gap-3 border-t border-hairline pt-4">
      <StepLink href={page > 1 ? href(page - 1) : null} direction="previous" />

      <p className="type-label text-ink-muted sm:hidden">
        Page {page} of {pageCount}
      </p>

      <ol className="flex items-center gap-1 max-sm:hidden">
        {pageItems(page, pageCount).map((item, index) =>
          item === "gap" ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-ink-muted">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={href(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-md type-button transition-colors",
                  item === page ? "border border-teal/40 bg-mint text-teal-ink" : "text-ink hover:bg-muted-bg"
                )}
              >
                {item}
              </Link>
            </li>
          )
        )}
      </ol>

      <StepLink href={page < pageCount ? href(page + 1) : null} direction="next" />
    </nav>
  )
}
