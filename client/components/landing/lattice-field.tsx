import { cn } from "@/lib/utils"

const WIDTH = 1440
const HEIGHT = 760
const BOND = 34
const ATOM_RADIUS = 2.4

type Point = { x: number; y: number }

function buildHoneycomb() {
  const a1: Point = { x: Math.sqrt(3) * BOND, y: 0 }
  const a2: Point = { x: (Math.sqrt(3) / 2) * BOND, y: 1.5 * BOND }
  const atoms: Point[] = []
  let bonds = ""

  for (let j = -1; j * a2.y < HEIGHT + BOND; j++) {
    for (let i = -Math.ceil(j / 2) - 1; (i + j / 2) * a1.x < WIDTH + BOND; i++) {
      const a = { x: i * a1.x + j * a2.x, y: j * a2.y }
      const b = { x: a.x, y: a.y + BOND }
      const up = { x: a.x + a2.x, y: a.y + a2.y }
      const upLeft = { x: a.x + a2.x - a1.x, y: a.y + a2.y }
      atoms.push(a, b)
      bonds += `M${a.x.toFixed(1)} ${a.y.toFixed(1)}V${b.y.toFixed(1)}`
      bonds += `M${b.x.toFixed(1)} ${b.y.toFixed(1)}L${up.x.toFixed(1)} ${up.y.toFixed(1)}`
      bonds += `M${b.x.toFixed(1)} ${b.y.toFixed(1)}L${upLeft.x.toFixed(1)} ${upLeft.y.toFixed(1)}`
    }
  }

  const visible = atoms.filter((p) => p.x > -BOND && p.x < WIDTH + BOND && p.y > -BOND && p.y < HEIGHT + BOND)
  return { atoms: visible, bonds }
}

const lattice = buildHoneycomb()
const isVibrating = (index: number) => index % 11 === 0
const vibrating = lattice.atoms.filter((_, index) => isVibrating(index))
const toPath = (points: Point[]) =>
  points
  .map(({ x, y }) => `M${(x - ATOM_RADIUS).toFixed(1)} ${y.toFixed(1)}a${ATOM_RADIUS} ${ATOM_RADIUS} 0 1 0 ${ATOM_RADIUS * 2} 0a${ATOM_RADIUS} ${ATOM_RADIUS} 0 1 0 ${-ATOM_RADIUS * 2} 0`)
  .join("")
const restingPath = toPath(lattice.atoms.filter((_, index) => !isVibrating(index)))
const allAtomsPath = toPath(lattice.atoms)

type LatticeFieldProps = { id: string; animated?: boolean; className?: string }

export function LatticeField({ id, animated = true, className }: LatticeFieldProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      className={cn("pointer-events-none", className)}
    >
      <defs>
        <radialGradient id={`${id}-fade`} cx="50%" cy="42%" r="70%">
          <stop offset="0%" stopColor="black" />
          <stop offset="34%" stopColor="black" />
          <stop offset="62%" stopColor="white" stopOpacity="0.85" />
          <stop offset="100%" stopColor="white" stopOpacity="0.25" />
        </radialGradient>
        <mask id={`${id}-mask`}>
          <rect width={WIDTH} height={HEIGHT} fill={`url(#${id}-fade)`} />
        </mask>
        <radialGradient id={`${id}-probe`}>
          <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--teal)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g mask={`url(#${id}-mask)`}>
        <path d={lattice.bonds} stroke="var(--teal)" strokeOpacity="0.14" strokeWidth="1" fill="none" />
        <path d={animated ? restingPath : allAtomsPath} fill="var(--teal)" fillOpacity="0.28" />
        {animated && vibrating.map(({ x, y }, index) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={ATOM_RADIUS + 0.4}
            fill="var(--teal)"
            fillOpacity="0.5"
            className="atom"
            style={{ animationDelay: `${-((index * 0.37) % 2.6).toFixed(2)}s` }}
          />
        ))}
        {animated && (
          <g className="probe">
            <circle cx={WIDTH * 0.32} cy={HEIGHT * 0.5} r="260" fill={`url(#${id}-probe)`} />
          </g>
        )}
      </g>
    </svg>
  )
}
