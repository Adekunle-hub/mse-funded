import Link from "next/link"

import { Wordmark } from "@/components/brand/wordmark"
import { HeaderShell } from "@/components/layout/header-shell"
import { MainNav } from "@/components/layout/main-nav"
import { MobileMenu } from "@/components/layout/mobile-menu"
import { NavSignUpButton } from "@/components/layout/nav-sign-up-button"
import { buttonVariants } from "@/components/ui/button"
import { routes } from "@/lib/routes"

export function SiteHeader() {
  return (
    <HeaderShell>
      <div className="container-page flex h-full items-center justify-between gap-6 max-lg:pr-2">
        <Wordmark />

        <MainNav className="max-lg:hidden" />

        <div className="flex items-center gap-4 max-lg:hidden">
          <Link href={routes.login} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Log in
          </Link>
          <NavSignUpButton />
        </div>

        <div className="flex items-center lg:hidden">
          <Link
            href={routes.login}
            className="inline-flex h-12 items-center px-3 type-button text-ink"
          >
            Log in
          </Link>
          <MobileMenu />
        </div>
      </div>
    </HeaderShell>
  )
}
