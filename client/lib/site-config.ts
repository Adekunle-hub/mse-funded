export const siteConfig = {
  name: "MseFunded",
  tagline: "Funded MSE study, checked by people.",
  description:
    "Fully funded MSc and PhD places for materials science and engineering students, with official links, checked deadlines and clear eligibility.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en_GB",
  timeZone: "Africa/Lagos",
  copyrightYear: 2026,
} as const
