"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

export function AuthSwitchLink({ href, label }: { href: string; label: string }) {
  const searchParams = useSearchParams()
  const query = searchParams.toString()

  return (
    <Link href={query ? `${href}?${query}` : href} className="font-medium text-teal underline-offset-4 hover:underline">
      {label}
    </Link>
  )
}
