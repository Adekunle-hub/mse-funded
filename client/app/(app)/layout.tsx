import { AppHeader } from "@/components/layout/app-header"
import { TabBar } from "@/components/layout/tab-bar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1 pb-12 lg:pb-20">
        {children}
      </main>
      <TabBar />
    </>
  )
}
