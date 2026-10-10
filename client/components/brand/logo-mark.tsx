import { cn } from "@/lib/utils"

const HEX_RADIUS = 8.6
const hexPoints = Array.from({ length: 6 }, (_, index) => {
  const angle = (Math.PI / 3) * index - Math.PI / 2
  return [16 + HEX_RADIUS * Math.cos(angle), 16 + HEX_RADIUS * Math.sin(angle)] as const
})
const hexPath = `M${hexPoints.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join("L")}Z`

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="6" className="fill-teal" />
      <g className="origin-center transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] [transform-box:view-box] group-hover:rotate-60">
        <path d={hexPath} fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="1.4" strokeLinejoin="round" />
        {hexPoints.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.7" className="fill-mint" />
        ))}
      </g>
      <path
        d="M12.2 16.3l2.6 2.6 5-5.6"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
