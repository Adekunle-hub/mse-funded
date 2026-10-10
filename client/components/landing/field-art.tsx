import type { CSSProperties, ReactNode } from "react"

const INK = "var(--ink)"
const TEAL = "var(--teal)"
const PLUM = "var(--plum)"

const delay = (seconds: number): CSSProperties => ({ animationDelay: `${seconds}s` })

function Frame({ children, fill = true }: { children: ReactNode; fill?: boolean }) {
  return (
    <svg
      viewBox="0 0 160 96"
      preserveAspectRatio={fill ? "xMidYMid slice" : "xMidYMid meet"}
      aria-hidden="true"
      className="h-full w-full"
    >
      {children}
    </svg>
  )
}

function Polymers() {
  const chains = [
    "M6 30 C26 8, 40 52, 60 30 S94 8, 114 30 S146 52, 156 30",
    "M4 56 C24 34, 44 78, 64 56 S98 34, 118 56 S148 78, 158 56",
    "M8 80 C28 62, 46 96, 66 80 S100 62, 120 80 S150 96, 158 80",
  ]
  return (
    <Frame>
      {chains.map((d, index) => (
        <g key={d} className="group-hover:float-y" style={delay(index * 0.5)}>
          <path d={d} fill="none" stroke={TEAL} strokeOpacity="0.35" strokeWidth="2" />
          <path d={d} fill="none" stroke={TEAL} strokeWidth="2" className="group-hover:dash-flow" style={delay(index * -0.8)} />
        </g>
      ))}
    </Frame>
  )
}

function Ceramics() {
  const grains = [
    "M0 0H46L52 30L22 44L0 36Z",
    "M46 0H104L96 26L52 30Z",
    "M104 0H160V30L128 38L96 26Z",
    "M0 36L22 44L30 74L0 82Z",
    "M22 44L52 30L78 52L62 80L30 74Z",
    "M52 30L96 26L104 56L78 52Z",
    "M96 26L128 38L134 66L104 56Z",
    "M128 38L160 30V72L134 66Z",
    "M0 82L30 74L36 96H0Z",
    "M30 74L62 80L70 96H36Z",
    "M62 80L78 52L104 56L110 96H70Z",
    "M104 56L134 66L140 96H110Z",
    "M134 66L160 72V96H140Z",
  ]
  return (
    <Frame>
      {grains.map((d, index) => (
        <path
          key={d}
          d={d}
          fill={index % 3 === 0 ? "var(--cream)" : index % 3 === 1 ? "var(--surface)" : "var(--mint)"}
          stroke={INK}
          strokeOpacity="0.35"
          strokeWidth="1.2"
          className="transition-[fill] duration-500 group-hover:fill-[var(--cream)]"
        />
      ))}
      <circle cx="78" cy="52" r="3" fill={TEAL} className="group-hover:float-y" />
    </Frame>
  )
}

function Metals() {
  const front = { x: 52, y: 34, size: 44 }
  const offset = { x: 22, y: -16 }
  const corners = [
    [front.x, front.y],
    [front.x + front.size, front.y],
    [front.x, front.y + front.size],
    [front.x + front.size, front.y + front.size],
  ]
  const back = corners.map(([x, y]) => [x + offset.x, y + offset.y])
  const center = [front.x + front.size / 2 + offset.x / 2, front.y + front.size / 2 + offset.y / 2]
  return (
    <Frame fill={false}>
      <g stroke={INK} strokeOpacity="0.3" strokeWidth="1.2" fill="none">
        <rect x={front.x} y={front.y} width={front.size} height={front.size} />
        <rect x={front.x + offset.x} y={front.y + offset.y} width={front.size} height={front.size} />
        {corners.map(([x, y], index) => (
          <line key={index} x1={x} y1={y} x2={back[index][0]} y2={back[index][1]} />
        ))}
        {corners.map(([x, y], index) => (
          <line key={`c${index}`} x1={x} y1={y} x2={center[0]} y2={center[1]} strokeDasharray="2 3" />
        ))}
      </g>
      {[...back, ...corners].map(([x, y], index) => (
        <circle key={`a${index}`} cx={x} cy={y} r="5" fill={index < 4 ? "var(--mint)" : TEAL} stroke={TEAL} strokeWidth="1.2" />
      ))}
      <circle cx={center[0]} cy={center[1]} r="7" fill={PLUM} className="group-hover:float-y" />
    </Frame>
  )
}

function Nanomaterials() {
  const particles = [
    [22, 28, 7], [50, 58, 11], [84, 26, 5], [104, 62, 9], [134, 34, 6], [72, 80, 4], [140, 76, 5], [28, 74, 4], [118, 14, 3],
  ]
  return (
    <Frame>
      {particles.map(([cx, cy, r], index) => (
        <g key={`${cx}-${cy}`} className="group-hover:float-y" style={delay(index * 0.35)}>
          <circle cx={cx} cy={cy} r={r + 4} fill={TEAL} fillOpacity="0.1" />
          <circle cx={cx} cy={cy} r={r} fill={index % 3 === 0 ? PLUM : TEAL} />
        </g>
      ))}
    </Frame>
  )
}

function Composites() {
  return (
    <Frame>
      {[0, 1, 2, 3].map((layer) => {
        const y = 10 + layer * 20
        return layer % 2 === 0 ? (
          <g key={layer}>
            <rect x="0" y={y} width="160" height="18" fill="var(--cream)" />
            {[4, 9, 14].map((offset) => (
              <line key={offset} x1="0" x2="160" y1={y + offset} y2={y + offset} stroke={TEAL} strokeWidth="1.6" className="group-hover:dash-flow" style={delay(layer * -0.6)} />
            ))}
          </g>
        ) : (
          <g key={layer}>
            <rect x="0" y={y} width="160" height="18" fill="var(--mint)" fillOpacity="0.6" />
            {Array.from({ length: 16 }, (_, index) => (
              <circle key={index} cx={6 + index * 10} cy={y + 9} r="3" fill={TEAL} />
            ))}
          </g>
        )
      })}
    </Frame>
  )
}

function Corrosion() {
  return (
    <Frame>
      <path
        d="M0 62 H24 Q30 62 32 70 Q36 80 42 70 Q44 62 52 62 H86 Q92 62 94 74 Q98 86 104 74 Q106 62 114 62 H160 V96 H0 Z"
        fill="var(--muted-bg)"
        stroke={INK}
        strokeOpacity="0.4"
        strokeWidth="1.2"
      />
      {[
        [36, 52, 3], [42, 44, 2], [98, 50, 3.5], [92, 40, 2], [104, 34, 2.5], [130, 50, 2],
      ].map(([cx, cy, r], index) => (
        <rect
          key={`${cx}-${cy}`}
          x={cx - r}
          y={cy - r}
          width={r * 2}
          height={r * 2}
          rx="1"
          fill={index % 2 ? PLUM : "var(--amber-ink)"}
          className="group-hover:float-y"
          style={delay(index * 0.4)}
        />
      ))}
      <path d="M60 20 Q66 32 60 36 Q54 32 60 20 Z" fill={TEAL} fillOpacity="0.6" className="group-hover:float-y" />
    </Frame>
  )
}

const art: Record<string, () => ReactNode> = {
  Polymers,
  Ceramics,
  Metals,
  Nanomaterials,
  Composites,
  Corrosion,
}

export function FieldArt({ field }: { field: string }) {
  const Art = art[field]
  return Art ? <Art /> : null
}
