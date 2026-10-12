"use client"

import Link from "next/link"
import { ArrowRight, Bell, Bookmark, CalendarDays, KeyRound, LogOut, Mail, Search, ShieldCheck } from "lucide-react"
import type { ReactNode } from "react"

import { SignInPrompt } from "@/components/auth/sign-in-prompt"
import { AvatarEditor } from "@/components/auth/avatar-editor"
import { ReminderList } from "@/components/tracker/reminders-panel"
import { Button, buttonVariants } from "@/components/ui/button"
import { Pill } from "@/components/ui/pill"
import { useCurrentUser, useLogout } from "@/hooks/use-auth"
import { useNow } from "@/hooks/use-now"
import { useSavedList } from "@/hooks/use-saved"
import type { User } from "@/lib/api/auth"
import { formatDate } from "@/lib/format/date"
import { routes } from "@/lib/routes"
import { closesInLabel, statusLabels, statusOrder, upcomingReminders } from "@/lib/scholarships/tracker"
import type { ApplicationStatus, SavedScholarship } from "@/lib/types/saved"
import { cn } from "@/lib/utils"

const statusColors: Record<ApplicationStatus, string> = {
  interested: "bg-mint",
  applying: "bg-teal",
  submitted: "bg-plum",
}

function signInLabel({ password, google }: User["signInMethods"]) {
  if (password && google) return "Email and Google"
  return google ? "Google" : "Email and password"
}

function Card({
  title,
  icon,
  children,
  className,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn("rounded-md border border-hairline bg-surface p-4 sm:p-6", className)}>
      <h2 className="flex items-center gap-2 type-heading-3">
        <span className="inline-flex size-8 items-center justify-center rounded-md bg-muted-bg text-teal [&_svg]:size-4">
          {icon}
        </span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function ProfileHeader({ user, savedCount }: { user: User; savedCount: number }) {
  return (
    <section aria-label="Your profile" className="overflow-hidden rounded-md border border-hairline bg-surface">
      <div
        aria-hidden="true"
        className="h-20 bg-[linear-gradient(110deg,var(--mint),var(--cream)_55%,var(--pink))] sm:h-24"
      />
      <div className="flex flex-col gap-4 px-4 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
          <AvatarEditor user={user} className="-mt-11 sm:-mt-12" />
          <div className="min-w-0">
            <p className="truncate type-heading-2">{user.name}</p>
            <p className="truncate text-ink-muted">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill tone="muted">
                <CalendarDays aria-hidden="true" />
                Member since {formatDate(user.memberSince)}
              </Pill>
              <Pill tone="muted">
                <KeyRound aria-hidden="true" />
                {signInLabel(user.signInMethods)}
              </Pill>
              {user.isAdmin && (
                <Pill tone="mint">
                  <ShieldCheck aria-hidden="true" />
                  Admin
                </Pill>
              )}
            </div>
          </div>
        </div>
        <Link href={routes.tracker} className={buttonVariants({ variant: "primary" })}>
          <Bookmark aria-hidden="true" />
          Your Scholarships ({savedCount})
        </Link>
      </div>
    </section>
  )
}

function Overview({ entries, now }: { entries: SavedScholarship[]; now: Date }) {
  const counts = Object.fromEntries(
    statusOrder.map((status) => [status, entries.filter((entry) => entry.status === status).length])
  ) as Record<ApplicationStatus, number>
  const { thisWeek, nextMonth } = upcomingReminders(entries, now)
  const next = thisWeek[0] ?? nextMonth[0]

  const tiles = [
    { label: "Saved", value: entries.length },
    { label: statusLabels.applying, value: counts.applying },
    { label: statusLabels.submitted, value: counts.submitted },
  ]

  return (
    <section aria-label="Your applications" className="rounded-md border border-hairline bg-surface p-4 sm:p-6">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label}>
            <dt className="type-body-sm text-ink-muted">{tile.label}</dt>
            <dd className="mt-1 type-heading-1 tabular-nums">{tile.value}</dd>
          </div>
        ))}
        <div className="min-w-0">
          <dt className="type-body-sm text-ink-muted">Next deadline</dt>
          {next ? (
            <dd className="mt-1">
              <span className={cn("type-heading-3", next.days <= 7 && "text-plum")}>{closesInLabel(next.days)}</span>
              <span className="block truncate type-body-sm text-ink-muted">{next.entry.scholarship.title}</span>
            </dd>
          ) : (
            <dd className="mt-1 type-heading-3 text-ink-muted">None in 30 days</dd>
          )}
        </div>
      </dl>

      {entries.length > 0 && (
        <div className="mt-6">
          <p className="type-label text-ink">Where your applications are</p>
          <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-muted-bg">
            {statusOrder.map((status) =>
              counts[status] > 0 ? (
                <span
                  key={status}
                  className={statusColors[status]}
                  style={{ width: `${(counts[status] / entries.length) * 100}%` }}
                />
              ) : null
            )}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 type-body-sm text-ink-muted">
            {statusOrder.map((status) => (
              <li key={status} className="inline-flex items-center gap-2">
                <span aria-hidden="true" className={cn("size-2.5 rounded-[2px]", statusColors[status])} />
                {statusLabels[status]} · {counts[status]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function ComingUp({ entries, now }: { entries: SavedScholarship[]; now: Date }) {
  return (
    <Card title="Coming up" icon={<CalendarDays />}>
      {entries.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-md bg-muted-bg p-4 sm:p-5">
          <p className="type-label text-ink">You haven&apos;t saved any scholarships yet</p>
          <p className="type-body-sm text-ink-muted">
            Save the places you like and their deadlines show up here, with reminders before each one closes.
          </p>
          <Link href={routes.scholarships} className={buttonVariants({ variant: "primary", size: "sm" })}>
            <Search aria-hidden="true" />
            Browse scholarships
          </Link>
        </div>
      ) : (
        <>
          <ReminderList entries={entries} now={now} />
          <Link
            href={routes.tracker}
            className="mt-4 inline-flex items-center gap-1.5 type-label text-teal hover:text-teal-hover"
          >
            See all Your Scholarships
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </>
      )}
    </Card>
  )
}

function Reminders({ entries }: { entries: SavedScholarship[] }) {
  const on = entries.filter((entry) => entry.remindersOn).length

  return (
    <Card title="Email reminders" icon={<Bell />}>
      <p className="text-ink">We email you 7 days, 3 days and 1 day before each saved deadline.</p>
      <p className="mt-2 type-body-sm text-ink-muted">
        {entries.length === 0
          ? "Reminders start when you save your first scholarship."
          : `Reminders are on for ${on} of your ${entries.length} saved ${entries.length === 1 ? "scholarship" : "scholarships"}. You can turn them off for any listing in Your Scholarships.`}
      </p>
    </Card>
  )
}

function Security({ user }: { user: User }) {
  const logout = useLogout()

  return (
    <Card title="Sign-in and security" icon={<KeyRound />}>
      <dl className="flex flex-col divide-y divide-hairline">
        <div className="flex items-center justify-between gap-3 pb-3">
          <dt className="inline-flex items-center gap-2 type-body-sm text-ink-muted">
            <Mail aria-hidden="true" className="size-4" />
            Email
          </dt>
          <dd className="truncate type-body-sm text-ink">{user.email}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <dt className="inline-flex items-center gap-2 type-body-sm text-ink-muted">
            <KeyRound aria-hidden="true" className="size-4" />
            Sign-in
          </dt>
          <dd className="type-body-sm text-ink">{signInLabel(user.signInMethods)}</dd>
        </div>
      </dl>
      <div className="mt-2 flex flex-wrap gap-2">
        {user.signInMethods.password && (
          <Link href={routes.forgotPassword} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Change password
          </Link>
        )}
        <Button variant="outline" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
          <LogOut aria-hidden="true" />
          {logout.isPending ? "Logging out…" : "Log out"}
        </Button>
      </div>
    </Card>
  )
}

export function AccountView() {
  const now = useNow()
  const { user, isLoading } = useCurrentUser()
  const saved = useSavedList()

  if (isLoading || (user && (!now || saved.isPending))) {
    return (
      <div aria-hidden="true" className="mt-6 flex flex-col gap-6">
        <div className="h-48 rounded-md bg-muted-bg" />
        <div className="h-32 rounded-md bg-muted-bg" />
      </div>
    )
  }

  if (!user) {
    return (
      <SignInPrompt
        title="Log in to your account"
        description="Your account keeps Your Scholarships and their deadlines in one place."
        next={routes.account}
      />
    )
  }

  const entries = saved.data ?? []

  return (
    <div className="mt-6 flex flex-col gap-6">
      <ProfileHeader user={user} savedCount={entries.length} />
      <Overview entries={entries} now={now!} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ComingUp entries={entries} now={now!} />
        <div className="flex flex-col gap-6">
          <Reminders entries={entries} />
          <Security user={user} />
          {user.isAdmin && (
            <Card title="Admin" icon={<ShieldCheck />}>
              <p className="type-body-sm text-ink-muted">Review held listings, answer reports and manage sources.</p>
              <Link href={routes.admin} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3")}>
                Open admin
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
