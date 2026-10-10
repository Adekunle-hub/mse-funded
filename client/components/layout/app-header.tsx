import type { ReactNode } from "react"

import { Wordmark } from "@/components/brand/wordmark"
import { AppNav } from "@/components/layout/app-nav"
import { MobileUserLink, UserMenu } from "@/components/layout/user-menu"
import { cn } from "@/lib/utils"

type AppHeaderProps = {
  mobileStart?: ReactNode
}

export function AppHeader({ mobileStart }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-hairline bg-surface lg:h-18">
      <div className="container-page flex h-full items-center justify-between gap-6 max-lg:px-2">
        <div className="flex items-center gap-6 max-lg:pl-2">
          <Wordmark className={cn(mobileStart && "max-lg:hidden")} />
          {mobileStart && <div className="lg:hidden">{mobileStart}</div>}
          <AppNav className="max-lg:hidden" />
        </div>

        <div className="max-lg:hidden">
          <UserMenu />
        </div>

        {!mobileStart && (
          <div className="lg:hidden">
            <MobileUserLink />
          </div>
        )}
      </div>
    </header>
  )
}
