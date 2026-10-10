import { cn } from "@/lib/utils"

function Bar({ className }: { className?: string }) {
  return <span className={cn("block rounded-control bg-muted-bg", className)} />
}

export function DetailSkeleton() {
  return (
    <div aria-busy="true" className="container-page pt-6 pb-24">
      <p className="sr-only" aria-live="polite">
        Loading scholarship…
      </p>
      <div aria-hidden="true" className="flex flex-col gap-12 lg:mt-10 lg:flex-row">
        <div className="max-w-reading flex-7">
          <div className="flex gap-2">
            <Bar className="h-7 w-14 rounded-md" />
            <Bar className="h-7 w-26 rounded-md" />
          </div>
          <Bar className="mt-4 h-10 w-[85%]" />
          <Bar className="mt-3 h-10 w-[60%]" />
          <Bar className="mt-4 h-4 w-[70%]" />
          <Bar className="mt-8 h-72 w-full rounded-card" />
        </div>
        <Bar className="h-80 max-w-105 flex-5 rounded-card max-lg:hidden" />
      </div>
    </div>
  )
}
