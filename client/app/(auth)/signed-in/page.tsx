import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { FinishSignIn } from "@/components/auth/finish-sign-in"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Signing you in",
  robots: { index: false, follow: false },
}

export default function SignedInPage() {
  return (
    <AuthShell title="Welcome" switchPrompt="Not you?" switchLabel="Log in" switchHref={routes.login}>
      <FinishSignIn />
    </AuthShell>
  )
}
