"use client"

import Link from "next/link"
import { Bookmark, LogOut, ShieldCheck } from "lucide-react"

import { SignInPrompt } from "@/components/auth/sign-in-prompt"
import { UserAvatar } from "@/components/auth/user-avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import { useCurrentUser, useLogout } from "@/hooks/use-auth"
import { useSavedList } from "@/hooks/use-saved"
import { routes } from "@/lib/routes"

export function AccountView() {
  const { user, isLoading } = useCurrentUser()
  const saved = useSavedList()
  const logout = useLogout()

  if (isLoading) {
    return <div aria-hidden="true" className="mt-6 h-40 max-w-reading rounded-md bg-muted-bg" />
  }

  if (!user) {
    return (
      <SignInPrompt
        title="Log in to your account"
        description="Your account keeps your Your Scholarships and deadlines in one place."
        next={routes.account}
      />
    )
  }

  const savedCount = saved.data?.length ?? 0

  return (
    <section aria-label="Your details" className="mt-6 max-w-reading rounded-md border border-hairline">
      <div className="flex items-center gap-4 p-4 sm:p-6">
        <UserAvatar name={user.name} size={56} />
        <div className="min-w-0">
          <p className="truncate type-heading-3">{user.name}</p>
          <p className="truncate text-ink-muted">{user.email}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-hairline p-4 sm:flex-row sm:p-6">
        <Link href={routes.tracker} className={buttonVariants({ variant: "outline" })}>
          <Bookmark aria-hidden="true" />
          Your Scholarships ({savedCount})
        </Link>
        {user.isAdmin && (
          <Link href={routes.admin} className={buttonVariants({ variant: "outline" })}>
            <ShieldCheck aria-hidden="true" />
            Admin
          </Link>
        )}
        <Button variant="outline" onClick={() => logout.mutate()} disabled={logout.isPending}>
          <LogOut aria-hidden="true" />
          {logout.isPending ? "Logging out…" : "Log out"}
        </Button>
      </div>
    </section>
  )
}
