import { cn } from "@/lib/utils"

function Bar({ className }: { className?: string }) {
  return <span className={cn("block rounded-control bg-muted-bg", className)} />
}

export function ResultCardSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-card border border-hairline bg-surface p-4 sm:p-6">
      <div className="flex justify-between gap-3">
        <div className="flex gap-2">
          <Bar className="h-7 w-14 rounded-md" />
          <Bar className="h-7 w-26 rounded-md" />
        </div>
        <Bar className="h-8 w-50 rounded-md max-sm:hidden" />
      </div>
      <Bar className="mt-5 h-5 w-[70%]" />
      <Bar className="mt-3 h-3.5 w-1/2" />
      <Bar className="mt-2 h-3.5 w-2/5" />
      <div className="mt-4 flex justify-between border-t border-hairline pt-4">
        <Bar className="h-4 w-40" />
        <Bar className="h-10 w-22" />
      </div>
    </div>
  )
}

export function ResultListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <p className="sr-only" aria-live="polite">
        Loading scholarships…
      </p>
      {Array.from({ length: count }, (_, index) => (
        <ResultCardSkeleton key={index} />
      ))}
    </div>
  )
}
