import { RevealStagger } from "@/components/motion/reveal"
import { verificationCallouts } from "@/content/landing"

export function VerificationCallouts() {
  return (
    <RevealStagger as="ol" gap={0.14} y={16} className="flex flex-col gap-3 lg:gap-14">
      {verificationCallouts.map((callout, index) => (
        <li key={callout.title} className="flex gap-3 lg:border-l lg:border-border-control lg:pl-3">
          <span
            aria-hidden="true"
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-ink type-caption font-medium text-white lg:hidden"
          >
            {index + 1}
          </span>
          <p>
            <span className="font-semibold lg:block lg:type-label">{callout.title}</span>
            <span className="text-ink-muted lg:block lg:type-body-sm">
              <span className="lg:hidden"> · </span>
              {callout.description}
            </span>
          </p>
        </li>
      ))}
    </RevealStagger>
  )
}
