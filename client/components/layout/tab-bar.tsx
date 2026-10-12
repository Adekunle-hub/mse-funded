"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bookmark, CircleUser, Search, Sparkles } from "lucide-react"
import type { ReactNode } from "react"

import { UserAvatar } from "@/components/auth/user-avatar"
import { useCurrentUser } from "@/hooks/use-auth"
import { routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

export function TabBar() {
  const pathname = usePathname()
  const { user } = useCurrentUser()

  const tabs: { href: string; label: string; icon: ReactNode }[] = [
    { href: routes.scholarships, label: "Search", icon: <Search aria-hidden="true" className="size-5" /> },
    { href: routes.tracker, label: "Saved", icon: <Bookmark aria-hidden="true" className="size-5" /> },
    { href: routes.assistant, label: "Ask AI", icon: <Sparkles aria-hidden="true" className="size-5" /> },
    user
      ? {
          href: routes.account,
          label: "Account",
          icon: <UserAvatar name={user.name} imageUrl={user.avatarUrl} size={22} />,
        }
      : { href: routes.login, label: "Log in", icon: <CircleUser aria-hidden="true" className="size-5" /> },
  ]

  return (
    <nav
      aria-label="App"
      className="sticky bottom-0 z-40 grid grid-cols-4 border-t border-hairline bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {tabs.map(({ href, label, icon }) => {
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
            {icon}
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
