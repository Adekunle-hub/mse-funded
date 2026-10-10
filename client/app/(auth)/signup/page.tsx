import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { AuthShell } from "@/components/auth/auth-shell"
import { SaveContextNote } from "@/components/auth/save-context-note"
import { SignupForm } from "@/components/auth/signup-form"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Create a free MseFunded account to save funded MSc and PhD places, track your applications and get deadline reminders.",
  alternates: { canonical: routes.signup },
  openGraph: { url: routes.signup },
}

export default function SignupPage({ searchParams }: PageProps<"/signup">) {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Save scholarships and get deadline reminders. Free."
      switchPrompt="Already have an account?"
      switchLabel="Log in"
      switchHref={routes.login}
      footer={
        <p className="text-center type-caption text-ink-muted">
          By creating an account you agree to our{" "}
          <Link href={routes.terms} className="text-teal underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href={routes.privacy} className="text-teal underline underline-offset-2">
            Privacy policy
          </Link>
          .
        </p>
      }
    >
      <Suspense fallback={null}>
        <SaveContextNote searchParams={searchParams} />
      </Suspense>
      <SignupForm />
    </AuthShell>
  )
}
