import type { Metadata, Viewport } from "next"

import { MotionProvider } from "@/components/motion/motion-provider"
import { fontVariables } from "@/lib/fonts"
import { siteConfig } from "@/lib/site-config"
import "./globals.css"

const defaultTitle = `${siteConfig.name} · Funded MSc and PhD places, every link checked`

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: defaultTitle, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "materials science scholarships",
    "funded PhD",
    "funded MSc",
    "MSE scholarships",
    "metallurgy PhD",
    "polymer science PhD",
    "scholarships for Nigerian students",
  ],
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    title: defaultTitle,
    description: siteConfig.description,
  },
  twitter: { card: "summary", title: defaultTitle, description: siteConfig.description },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" data-scroll-behavior="smooth" className={fontVariables}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-control bg-surface px-4 py-3 type-button text-ink focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  )
}
