import { ArrowUpRight } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function officialDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

type OfficialLinkProps = {
  url: string
  primary: boolean
  className?: string
}

export function OfficialLink({ url, primary, className }: OfficialLinkProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant: primary ? "primary" : "outline", size: "lg" }), className)}
    >
      Go to official page
      <ArrowUpRight aria-hidden="true" />
      <span className="sr-only"> (opens {officialDomain(url)} in a new tab)</span>
    </a>
  )
}
