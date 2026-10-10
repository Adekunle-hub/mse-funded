"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bookmark, CircleUser, Search, type LucideIcon } from "lucide-react"

import { routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

const tabs: { href: string; label: string; icon: LucideIcon }[] = [
  { href: routes.scholarships, label: "Search", icon: Search },
  { href: routes.tracker, label: "Saved", icon: Bookmark },
  { href: routes.login, label: "Account", icon: CircleUser },
]

export function TabBar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="App"
      className="sticky bottom-0 z-40 grid grid-cols-3 border-t border-hairline bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mt-px flex h-16 flex-col items-center justify-center gap-0.5 border-t-2 border-transparent type-caption font-medium text-ink-muted",
              active && "border-teal text-teal"
            )}
          >
            <Icon aria-hidden="true" className="size-5" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
