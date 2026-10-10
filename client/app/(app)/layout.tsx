import { AppHeader } from "@/components/layout/app-header"
import { TabBar } from "@/components/layout/tab-bar"
import { AppProviders } from "@/components/providers/app-providers"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AppHeader />
      <main id="main" className="flex-1 pb-12 lg:pb-20">
        {children}
      </main>
      <TabBar />
    </AppProviders>
  )
}
