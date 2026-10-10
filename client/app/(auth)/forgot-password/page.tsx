import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Get a link to choose a new MseFunded password.",
  alternates: { canonical: routes.forgotPassword },
  robots: { index: false, follow: true },
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to choose a new one."
      switchPrompt="Remembered it?"
      switchLabel="Log in"
      switchHref={routes.login}
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
