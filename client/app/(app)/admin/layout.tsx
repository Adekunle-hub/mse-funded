import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin",
  description: "How MseFunded is running.",
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page pt-4 sm:pt-6 lg:pt-8">
      <h1 className="type-heading-1">Admin</h1>
      {children}
    </div>
  )
}
