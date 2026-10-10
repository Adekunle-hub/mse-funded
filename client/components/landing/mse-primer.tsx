import { MaterialsTetrahedron } from "@/components/landing/materials-tetrahedron"
import { SectionHeading } from "@/components/landing/section-heading"

export function MsePrimer() {
  return (
    <section aria-labelledby="mse-title" className="container-page py-12 sm:py-16 lg:py-20">
      <MaterialsTetrahedron
        heading={
          <SectionHeading
            id="mse-title"
            eyebrow="What is MSE?"
            title="One idea holds the whole field together"
            description="Materials science links how a material is made, how its atoms are arranged, how it behaves and how it performs in use. Every project here sits somewhere on this tetrahedron."
          />
        }
      />
    </section>
  )
}
