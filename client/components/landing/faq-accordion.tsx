"use client"

import { motion } from "motion/react"
import { Plus } from "lucide-react"
import { useId, useState } from "react"

import { cn } from "@/lib/utils"

type FaqAccordionProps = {
  items: { question: string; answer: string }[]
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const baseId = useId()

  return (
    <div className="border-t border-hairline">
      {items.map((item, index) => {
        const open = openIndex === index
        const panelId = `${baseId}-panel-${index}`
        const buttonId = `${baseId}-button-${index}`
        return (
          <div key={item.question} className="border-b border-hairline">
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
                className="group flex min-h-12 w-full items-center justify-between gap-4 py-3.5 text-left font-medium text-ink sm:py-4"
              >
                <span className="transition-transform duration-300 group-hover:translate-x-1">{item.question}</span>
                <motion.span
                  animate={{ rotate: open ? 135 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors duration-200",
                    open ? "border-ink bg-ink text-white" : "border-hairline"
                  )}
                >
                  <Plus aria-hidden="true" className="size-4" />
                </motion.span>
              </button>
            </h3>
            <motion.div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              initial={false}
              animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
              transition={{ height: { type: "spring", stiffness: 260, damping: 30 }, opacity: { duration: 0.25 } }}
              inert={!open}
              className="overflow-hidden"
            >
              <p className="max-w-150 pb-4 text-ink-muted sm:pb-5">{item.answer}</p>
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
