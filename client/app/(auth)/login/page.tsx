import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to MseFunded to see your saved scholarships, notes and upcoming deadlines.",
  alternates: { canonical: routes.login },
  robots: { index: false, follow: true },
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see your saved scholarships and deadlines."
      switchPrompt="New here?"
      switchLabel="Create an account"
      switchHref={routes.signup}
    >
      <LoginForm />
    </AuthShell>
  )
}
