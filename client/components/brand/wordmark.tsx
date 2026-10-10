import Link from "next/link"

import { LogoMark } from "@/components/brand/logo-mark"
import { routes } from "@/lib/routes"
import { siteConfig } from "@/lib/site-config"
import { cn } from "@/lib/utils"

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href={routes.home}
      aria-label={`${siteConfig.name}, home`}
      className={cn("group inline-flex min-h-12 items-center gap-2.5 whitespace-nowrap", className)}
    >
      <LogoMark className="size-7 lg:size-8" />
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-semibold tracking-[-0.03em] text-ink lg:text-lg">
          Mse<span className="text-teal">Funded</span>
        </span>
        <span className="mt-1 text-[11px] font-medium tracking-[0.1em] text-ink-muted uppercase max-sm:hidden">
          Funded MSE study
        </span>
      </span>
    </Link>
  )
}
