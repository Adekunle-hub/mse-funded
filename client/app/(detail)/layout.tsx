import { AppHeader } from "@/components/layout/app-header"
import { BackToResults } from "@/components/search/back-to-results"

export default function DetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader
        mobileStart={<BackToResults label="Results" className="h-12 px-2 type-button text-ink" />}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
    </>
  )
}
