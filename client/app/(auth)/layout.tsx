import { AppProviders } from "@/components/providers/app-providers"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>
}
