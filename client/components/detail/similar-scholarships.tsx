import { ResultCard } from "@/components/scholarship/result-card"
import { ResultCardSkeleton } from "@/components/scholarship/result-card-skeleton"
import { SaveButton } from "@/components/scholarship/save-button"
import { getSimilarScholarships } from "@/lib/api/scholarships"
import { routes } from "@/lib/routes"
import { getRenderTime } from "@/lib/time"

const gridClass = "mt-4 grid gap-3 sm:mt-6 md:grid-cols-3 md:gap-6"

export async function SimilarScholarships({ scholarshipId }: { scholarshipId: string }) {
  const [items, now] = await Promise.all([getSimilarScholarships(scholarshipId), getRenderTime()])
  if (items.length === 0) return null

  return (
    <section aria-labelledby="similar-title" className="mt-10 border-t border-hairline pt-8 lg:mt-16 lg:pt-10">
      <h2 id="similar-title" className="type-heading-2">
        Similar scholarships
      </h2>
      <ul className={gridClass}>
        {items.map((item) => (
          <li key={item.id}>
            <ResultCard
              scholarship={item}
              now={now}
              href={routes.scholarship(item.id)}
              compact
              className="h-full"
              action={<SaveButton scholarship={item} />}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function SimilarScholarshipsSkeleton() {
  return (
    <div className="mt-10 border-t border-hairline pt-8 lg:mt-16 lg:pt-10">
      <p className="type-heading-2">Similar scholarships</p>
      <div className={gridClass}>
        <ResultCardSkeleton />
        <ResultCardSkeleton />
        <ResultCardSkeleton />
      </div>
    </div>
  )
}
