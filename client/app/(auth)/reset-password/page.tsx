import type { Metadata } from "next"
import { Suspense } from "react"

import { AuthShell } from "@/components/auth/auth-shell"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Choose a new password for your MseFunded account.",
  alternates: { canonical: routes.resetPassword },
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Pick a password you don't use anywhere else."
      switchPrompt="Remembered it?"
      switchLabel="Log in"
      switchHref={routes.login}
    >
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  )
}
