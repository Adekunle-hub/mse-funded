"use client"

import { AnimatePresence, motion } from "motion/react"
import { Check } from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"

import { Reveal } from "@/components/motion/reveal"
import { tetrahedron, type TetrahedronNode } from "@/content/landing"
import { cn } from "@/lib/utils"

const VIEW = { width: 360, height: 320 }

const nodes: Record<TetrahedronNode, { x: number; y: number; labelBelow?: boolean }> = {
  performance: { x: 180, y: 34 },
  processing: { x: 42, y: 262, labelBelow: true },
  properties: { x: 318, y: 262, labelBelow: true },
  structure: { x: 262, y: 206, labelBelow: true },
  characterisation: { x: 168, y: 170 },
}

const corners: TetrahedronNode[] = ["processing", "structure", "properties", "performance"]
const cycle: TetrahedronNode[] = [...corners, "characterisation"]
const CYCLE_MS = 4500

const edges: [TetrahedronNode, TetrahedronNode][] = [
  ["performance", "processing"],
  ["performance", "properties"],
  ["processing", "properties"],
  ["performance", "structure"],
  ["processing", "structure"],
  ["properties", "structure"],
]

export function MaterialsTetrahedron({ heading }: { heading: ReactNode }) {
  const [active, setActive] = useState<TetrahedronNode>("structure")
  const [autoplay, setAutoplay] = useState(true)
  const detail = tetrahedron[active]

  useEffect(() => {
    if (!autoplay || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const timer = setInterval(() => {
      setActive((current) => cycle[(cycle.indexOf(current) + 1) % cycle.length])
    }, CYCLE_MS)
    return () => clearInterval(timer)
  }, [autoplay])

  const select = (node: TetrahedronNode) => {
    setAutoplay(false)
    setActive(node)
  }

  const isLit = (a: TetrahedronNode, b: TetrahedronNode) =>
    active === "characterisation" || a === active || b === active

  return (
    <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-8">
      <div className="lg:col-start-1 lg:row-start-1">{heading}</div>

      <Reveal className="relative mx-auto aspect-[360/320] w-full max-w-110 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-w-none lg:self-center">
        <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
          {edges.map(([a, b]) => {
            const hidden = a === "structure" || b === "structure"
            const lit = isLit(a, b)
            return (
              <line
                key={`${a}-${b}`}
                x1={nodes[a].x}
                y1={nodes[a].y}
                x2={nodes[b].x}
                y2={nodes[b].y}
                stroke={lit ? "var(--teal)" : "var(--ink)"}
                strokeOpacity={lit ? 0.9 : 0.18}
                strokeWidth={lit ? 1.6 : 1}
                strokeDasharray={hidden && !lit ? "4 5" : undefined}
                className={cn("transition-[stroke,stroke-opacity] duration-500", lit && "dash-flow")}
              />
            )
          })}
          {corners.map((corner) => (
            <line
              key={`centre-${corner}`}
              x1={nodes.characterisation.x}
              y1={nodes.characterisation.y}
              x2={nodes[corner].x}
              y2={nodes[corner].y}
              stroke="var(--plum)"
              strokeOpacity={active === "characterisation" ? 0.55 : 0.12}
              strokeWidth="1"
              strokeDasharray="1 4"
              className="transition-[stroke-opacity] duration-500"
            />
          ))}
        </svg>

        {cycle.map((node) => {
          const { x, y, labelBelow } = nodes[node]
          const selected = node === active
          const isCentre = node === "characterisation"
          return (
            <button
              key={node}
              type="button"
              aria-pressed={selected}
              aria-label={tetrahedron[node].title}
              onClick={() => select(node)}
              style={{ left: `${(x / VIEW.width) * 100}%`, top: `${(y / VIEW.height) * 100}%` }}
              className={cn(
                "group absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-md p-3 sm:p-1.5",
                labelBelow ? "flex-col" : "flex-col-reverse"
              )}
            >
              <motion.span
                animate={{ scale: selected ? 1.3 : 1, rotate: selected ? 45 : 0 }}
                whileHover={{ scale: selected ? 1.3 : 1.15 }}
                transition={{ type: "spring", stiffness: 320, damping: 16 }}
                className={cn(
                  "flex size-4 items-center justify-center rounded-[4px] border-2 transition-colors duration-300 lg:size-5",
                  isCentre ? "border-plum" : "border-teal",
                  selected ? (isCentre ? "bg-plum" : "bg-teal") : "bg-surface",
                  selected && "live-dot"
                )}
              />
              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 type-label whitespace-nowrap transition-colors duration-300 max-sm:hidden lg:px-2.5 lg:py-1",
                  selected ? "border-ink bg-ink text-white" : "border-hairline bg-surface text-ink group-hover:border-border-control"
                )}
              >
                {tetrahedron[node].title}
              </span>
            </button>
          )
        })}
      </Reveal>

      <div className="flex flex-col gap-3 lg:col-start-1 lg:row-start-2">
        <div role="group" aria-label="Parts of the tetrahedron" className="flex flex-wrap gap-2 sm:hidden">
          {cycle.map((node) => (
            <button
              key={node}
              type="button"
              aria-pressed={node === active}
              onClick={() => select(node)}
              className={cn(
                "h-9 rounded-md border px-3 type-label",
                node === active ? "border-ink bg-ink text-white" : "border-hairline bg-surface text-ink"
              )}
            >
              {tetrahedron[node].title}
            </button>
          ))}
        </div>

        <div aria-live="polite" className="overflow-hidden rounded-md border border-hairline bg-surface p-4 sm:p-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="type-label tracking-[0.08em] text-ink-muted uppercase">
                {active === "characterisation" ? "At the centre" : "Corner of the tetrahedron"}
              </p>
              <h3 className="mt-1.5 type-heading-2 text-ink">{detail.title}</h3>
              <p className="mt-1.5 text-ink-muted">{detail.summary}</p>
              <p className="mt-4 type-label text-ink">Typical PhD topics</p>
              <ul className="mt-2 grid gap-2">
                {detail.topics.map((topic, index) => (
                  <motion.li
                    key={topic}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 + index * 0.06, duration: 0.3 }}
                    className="flex gap-2.5"
                  >
                    <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-teal" />
                    {topic}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
          <div className="mt-5 flex gap-1.5" aria-hidden="true">
            {cycle.map((node) => (
              <span key={node} className="relative h-1 flex-1 overflow-hidden rounded-[2px] bg-muted-bg">
                {node === active && (
                  <motion.span
                    layoutId="tetra-progress"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute inset-0 bg-teal"
                  />
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
