import { cva } from "class-variance-authority"
import { AlarmClock, Calendar, CalendarCheck, CalendarX, Clock, type LucideIcon } from "lucide-react"

import { getDeadlineStatus, type DeadlineUrgency } from "@/lib/scholarships/deadline"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit items-center gap-1.5 rounded-md whitespace-nowrap font-medium",
  {
    variants: {
      urgency: {
        comfortable: "bg-mint text-teal-ink",
        soon: "bg-pink text-plum",
        urgent: "bg-plum text-white",
        closed: "bg-muted-bg text-muted-ink",
      },
      size: {
        md: "h-7 px-2.5 type-label [&_svg]:size-3.5",
        lg: "h-9 px-3 type-button [&_svg]:size-4",
      },
    },
  }
)

const urgencyIcons: Record<DeadlineUrgency, LucideIcon> = {
  comfortable: Calendar,
  soon: Clock,
  urgent: AlarmClock,
  closed: CalendarX,
}

type DeadlineBadgeProps = {
  deadline: string | null
  now: Date
  size?: "md" | "lg"
  className?: string
}

export function DeadlineBadge({ deadline, now, size = "md", className }: DeadlineBadgeProps) {
  if (!deadline) {
    return (
      <span className={cn(badgeVariants({ urgency: "comfortable", size }), className)}>
        <CalendarCheck aria-hidden="true" />
        No fixed deadline
      </span>
    )
  }

  const { urgency, label } = getDeadlineStatus(deadline, now, { withYear: size === "lg" })
  const Icon = urgencyIcons[urgency]

  return (
    <time dateTime={deadline} className={cn(badgeVariants({ urgency, size }), className)}>
      <Icon aria-hidden="true" />
      {label}
    </time>
  )
}
