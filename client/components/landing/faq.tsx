import { FaqAccordion } from "@/components/landing/faq-accordion"
import { SectionHeading } from "@/components/landing/section-heading"
import { Reveal } from "@/components/motion/reveal"
import { faqs } from "@/content/landing"

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="container-page py-12 sm:py-16 lg:py-20">
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <SectionHeading
          id="faq-title"
          eyebrow="Questions"
          title="Before you apply"
          description="Short answers to what MSE students ask us most."
          className="lg:sticky lg:top-28 lg:self-start"
        />
        <Reveal delay={0.1}>
          <FaqAccordion items={faqs} />
        </Reveal>
      </div>
    </section>
  )
}
