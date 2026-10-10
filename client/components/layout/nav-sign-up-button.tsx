"use client"

import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { usePrimaryCtaVisible } from "@/hooks/use-primary-cta-visible"
import { routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

export function NavSignUpButton({ className }: { className?: string }) {
  const primaryCtaVisible = usePrimaryCtaVisible()

  return (
    <Link
      href={routes.signup}
      className={cn(
        buttonVariants({ variant: primaryCtaVisible ? "outline" : "primary", size: "sm" }),
        "duration-150",
        className
      )}
    >
      Sign up
    </Link>
  )
}
