import { cn } from "@/lib/utils"

const outerAtoms = [
  [16, 46],
  [16, 19],
  [48, 19],
  [48, 46],
] as const

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="64" height="64" rx="14" className="fill-teal" />
      <path
        d="M16 46V19l16 16 16-16v27"
        fill="none"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {outerAtoms.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4.6" className="fill-mint" />
      ))}
      <circle
        cx="32"
        cy="35"
        r="5.4"
        className="origin-center fill-pink transition-transform duration-300 [transform-box:fill-box] group-hover:scale-125"
      />
    </svg>
  )
}
