import Link from "next/link"

import { Wordmark } from "@/components/brand/wordmark"
import { GiantWordmark } from "@/components/layout/giant-wordmark"
import { routes } from "@/lib/routes"
import { siteConfig } from "@/lib/site-config"

const links = [
  { label: "Scholarships", href: routes.scholarships },
  { label: "Saved", href: routes.tracker },
  { label: "How we check", href: routes.howWeCheck },
  { label: "Log in", href: routes.login },
]

export function SiteFooter() {
  return (
    <footer className="overflow-hidden border-t border-hairline">
      <div className="container-page flex flex-col gap-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:py-8">
        <div className="flex flex-col gap-1">
          <Wordmark className="min-h-0" />
          <p className="type-body-sm text-ink-muted">A solo project by Mujeeb, built for materials science students.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="-mx-2 flex flex-wrap">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group/link inline-flex h-10 items-center px-2 type-label text-ink-muted transition-colors duration-200 hover:text-ink"
                >
                  <span className="bg-linear-to-r from-ink to-ink bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-300 ease-out group-hover/link:bg-[length:100%_1px]">
                    {link.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <p className="container-page border-t border-hairline py-3 type-caption text-ink-muted sm:py-4">
        © {siteConfig.copyrightYear} {siteConfig.name}. Deadlines can change. Always confirm on the official page.
      </p>

      <GiantWordmark />
    </footer>
  )
}
