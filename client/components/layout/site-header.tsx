import { Wordmark } from "@/components/brand/wordmark"
import { HeaderShell } from "@/components/layout/header-shell"
import { MainNav } from "@/components/layout/main-nav"
import { MobileMenu } from "@/components/layout/mobile-menu"
import { MobileUserLink, UserMenu } from "@/components/layout/user-menu"

export function SiteHeader() {
  return (
    <HeaderShell>
      <div className="container-page flex h-full items-center justify-between gap-6 max-lg:pr-2">
        <Wordmark />

        <MainNav className="max-lg:hidden" />

        <div className="max-lg:hidden">
          <UserMenu swapSignUpColor />
        </div>

        <div className="flex items-center lg:hidden">
          <MobileUserLink />
          <MobileMenu />
        </div>
      </div>
    </HeaderShell>
  )
}
