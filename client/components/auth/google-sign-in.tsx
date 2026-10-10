"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

import { FormAlert } from "@/components/auth/form-alert"
import { buttonVariants } from "@/components/ui/button"
import { apiBaseUrl } from "@/lib/api/config"
import { cn } from "@/lib/utils"

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

function googleHref(params: URLSearchParams | null) {
  const query = new URLSearchParams()
  const next = params?.get("next")
  const save = params?.get("save")
  if (next) query.set("next", next)
  if (save) query.set("save", save)
  const search = query.toString()
  return `${apiBaseUrl}/auth/google${search ? `?${search}` : ""}`
}

function GoogleLink({ href }: { href: string }) {
  return (
    <a href={href} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full gap-3")}>
      <GoogleLogo />
      Continue with Google
    </a>
  )
}

function GoogleLinkWithReturn() {
  return <GoogleLink href={googleHref(useSearchParams())} />
}

function GoogleFailedAlert() {
  return useSearchParams().get("error") === "google" ? (
    <FormAlert message="Google sign-in didn't work. Try again, or log in with your email." />
  ) : null
}

export function GoogleSignInError() {
  return (
    <Suspense>
      <GoogleFailedAlert />
    </Suspense>
  )
}

export function GoogleSignIn() {
  return (
    <>
      <Suspense fallback={<GoogleLink href={googleHref(null)} />}>
        <GoogleLinkWithReturn />
      </Suspense>
      <div className="flex items-center gap-3 type-body-sm text-ink-muted">
        <span aria-hidden="true" className="h-px flex-1 bg-hairline" />
        or use your email
        <span aria-hidden="true" className="h-px flex-1 bg-hairline" />
      </div>
    </>
  )
}
