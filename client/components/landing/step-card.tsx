import { cva } from "class-variance-authority"

import type { AccentTone } from "@/content/landing"

const stepCardVariants = cva(
  "group flex h-full flex-col rounded-md border border-hairline p-4 transition-colors sm:p-5 duration-200 hover:border-border-control lg:min-h-72 lg:p-7",
  { variants: { tone: { mint: "bg-mint", cream: "bg-cream", pink: "bg-pink" } } }
)

type StepCardProps = {
  number: number
  title: string
  description: string
  tone: AccentTone
}

export function StepCard({ number, title, description, tone }: StepCardProps) {
  return (
    <div className={stepCardVariants({ tone })}>
      <span
        aria-hidden="true"
        className="mb-6 inline-flex size-16 items-center justify-center rounded-md border border-ink/10 bg-surface/70 type-numeral text-[46px] text-ink transition-transform duration-300 group-hover:-rotate-3 lg:mb-12"
      >
        {number}
      </span>
      <h3 className="type-heading-2 text-ink">{title}</h3>
      <p className="mt-2 text-ink-muted">{description}</p>
    </div>
  )
}
