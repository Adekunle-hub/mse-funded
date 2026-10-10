import { cn } from "@/lib/utils"

const ROTATOR_SIZE = 6

export function WordRotator({ words, className }: { words: string[]; className?: string }) {
  const cycle = words.slice(0, ROTATOR_SIZE)

  return (
    <>
      <span aria-hidden="true" className={cn("word-rotator", className)}>
        <span>
          {[...cycle, cycle[0]].map((word, index) => (
            <span key={`${word}-${index}`} className="h-[1lh] whitespace-nowrap">
              {word}
            </span>
          ))}
        </span>
      </span>
      <span className="sr-only">{cycle.join(", ")}</span>
    </>
  )
}
