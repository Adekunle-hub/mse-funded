export const routes = {
  home: "/",
  scholarships: "/scholarships",
  scholarship: (id: string) => `/scholarships/${encodeURIComponent(id)}`,
  tracker: "/tracker",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  howItWorks: "/#how-it-works",
  howWeCheck: "/#how-we-check",
  howWeCheckDetail: "/how-we-check",
  about: "/about",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
} as const

export type NavLink = { label: string; href: string }

export const mainNav: NavLink[] = [
  { label: "Scholarships", href: routes.scholarships },
  { label: "How it works", href: routes.howItWorks },
  { label: "How we check", href: routes.howWeCheck },
  { label: "About", href: routes.about },
]

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Scholarships", href: routes.scholarships },
      { label: "How we check", href: routes.howWeCheck },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: routes.about },
      { label: "Contact", href: routes.contact },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: routes.privacy },
      { label: "Terms", href: routes.terms },
    ],
  },
]
