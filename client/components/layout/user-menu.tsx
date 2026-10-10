"use client"

import { Menu } from "@base-ui/react/menu"
import Link from "next/link"
import { Bookmark, ChevronDown, LogOut, ShieldCheck, UserRound } from "lucide-react"

import { UserAvatar } from "@/components/auth/user-avatar"
import { NavSignUpButton } from "@/components/layout/nav-sign-up-button"
import { buttonVariants } from "@/components/ui/button"
import { useCurrentUser, useLogout } from "@/hooks/use-auth"
import { routes } from "@/lib/routes"

const itemClass =
  "flex h-10 cursor-pointer items-center gap-2.5 rounded-md px-2.5 type-label text-ink outline-none data-highlighted:bg-muted-bg"

export function UserMenu({ swapSignUpColor = false }: { swapSignUpColor?: boolean }) {
  const { user, isLoading } = useCurrentUser()
  const logout = useLogout()

  if (isLoading) return <span aria-hidden="true" className="size-9 rounded-md bg-muted-bg" />

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link href={routes.login} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Log in
        </Link>
        {swapSignUpColor ? (
          <NavSignUpButton />
        ) : (
          <Link href={routes.signup} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Sign up
          </Link>
        )}
      </div>
    )
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Account menu for ${user.name}`}
        className="flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-muted-bg data-popup-open:bg-muted-bg"
      >
        <UserAvatar name={user.name} />
        <ChevronDown aria-hidden="true" className="size-4 text-ink-muted" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
          <Menu.Popup className="w-60 rounded-md border border-hairline bg-surface p-1.5 outline-none">
            <div className="flex items-center gap-2.5 border-b border-hairline px-2.5 pt-1.5 pb-3">
              <UserAvatar name={user.name} size={32} />
              <div className="min-w-0">
                <p className="truncate type-label text-ink">{user.name}</p>
                <p className="truncate type-body-sm text-ink-muted">{user.email}</p>
              </div>
            </div>
            <div className="pt-1.5">
              <Menu.Item render={<Link href={routes.tracker} />} className={itemClass}>
                <Bookmark aria-hidden="true" className="size-4" />
                Your Scholarships
              </Menu.Item>
              <Menu.Item render={<Link href={routes.account} />} className={itemClass}>
                <UserRound aria-hidden="true" className="size-4" />
                Account
              </Menu.Item>
              {user.isAdmin && (
                <Menu.Item render={<Link href={routes.admin} />} className={itemClass}>
                  <ShieldCheck aria-hidden="true" className="size-4" />
                  Admin
                </Menu.Item>
              )}
              <Menu.Item onClick={() => logout.mutate()} className={itemClass}>
                <LogOut aria-hidden="true" className="size-4" />
                Log out
              </Menu.Item>
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

export function MobileUserLink() {
  const { user, isLoading } = useCurrentUser()

  if (isLoading) return <span aria-hidden="true" className="mx-1.5 size-9 rounded-md bg-muted-bg" />

  if (!user) {
    return (
      <Link href={routes.login} className="inline-flex h-12 items-center px-3 type-button text-ink">
        Log in
      </Link>
    )
  }

  return (
    <Link href={routes.account} aria-label="Your account" className="inline-flex size-12 items-center justify-center">
      <UserAvatar name={user.name} />
    </Link>
  )
}
