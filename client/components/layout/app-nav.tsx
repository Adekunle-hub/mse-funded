"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useSavedList } from "@/hooks/use-saved"
import { routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

function SavedCount() {
  const { data } = useSavedList()
  if (!data?.length) return null
  return (
    <span className="inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-md bg-muted-bg px-1.5 type-caption font-medium text-ink">
      {data.length}
      <span className="sr-only"> saved</span>
    </span>
  )
}

export function AppNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const links = [
    { href: routes.scholarships, label: "Scholarships", active: pathname.startsWith(routes.scholarships) },
    { href: routes.tracker, label: "Saved", active: pathname.startsWith(routes.tracker), count: true },
  ]

  return (
    <nav aria-label="App" className={className}>
      <ul className="flex items-center gap-8">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={link.active ? "page" : undefined}
              className="group inline-flex items-center gap-2 type-button text-ink"
            >
              <span
                className={cn(
                  "underline-offset-8 group-hover:underline",
                  link.active && "underline decoration-2"
                )}
              >
                {link.label}
              </span>
              {link.count && <SavedCount />}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
