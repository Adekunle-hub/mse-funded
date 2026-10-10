import type { Metadata } from "next"

import { AccountView } from "@/components/auth/account-view"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Your account",
  description: "Your MseFunded account details and Your Scholarships.",
  alternates: { canonical: routes.account },
  robots: { index: false, follow: true },
}

export default function AccountPage() {
  return (
    <div className="container-page pt-4 sm:pt-6 lg:pt-8">
      <h1 className="type-heading-1">Your account</h1>
      <AccountView />
    </div>
  )
}
