import { SectionHeading } from "@/components/landing/section-heading"
import { StepCard } from "@/components/landing/step-card"
import { RevealStagger } from "@/components/motion/reveal"
import { steps } from "@/content/landing"

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-it-works-title" className="container-page pb-12 sm:pb-16 lg:pb-20">
      <SectionHeading id="how-it-works-title" eyebrow="How it works" title="Three steps, no guesswork" align="center" />
      <RevealStagger as="ol" gap={0.12} className="relative mt-6 grid gap-3 sm:mt-8 lg:mt-12 lg:grid-cols-3 lg:gap-5">
        <span aria-hidden="true" className="absolute top-[3.25rem] right-[16%] left-[16%] hidden border-t border-dashed border-ink/20 lg:block" />
        {steps.map((step, index) => (
          <li key={step.title} className="relative">
            <StepCard number={index + 1} {...step} />
          </li>
        ))}
      </RevealStagger>
    </section>
  )
}
