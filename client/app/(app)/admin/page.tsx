import type { Metadata } from "next"

import { AdminSummary } from "@/components/admin/admin-summary"

export const metadata: Metadata = {
  title: "Admin",
  description: "How MseFunded is running.",
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return (
    <div className="container-page pt-4 sm:pt-6 lg:pt-8">
      <h1 className="type-heading-1">Admin</h1>
      <p className="mt-1 text-ink-muted">How MseFunded is running right now.</p>
      <AdminSummary />
    </div>
  )
}
