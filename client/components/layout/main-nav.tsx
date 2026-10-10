import Link from "next/link"

import { mainNav } from "@/lib/routes"

export function MainNav({ className }: { className?: string }) {
  return (
    <nav aria-label="Main" className={className}>
      <ul className="flex items-center gap-8">
        {mainNav.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="type-button text-ink decoration-1 underline-offset-[6px] hover:underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
