import { Bookmark } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SaveButtonPreview() {
  return (
    <span
      aria-hidden="true"
      className={cn(
        buttonVariants({ variant: "outline", size: "icon" }),
        "pointer-events-none sm:h-10 sm:w-auto sm:px-4"
      )}
    >
      <Bookmark />
      <span className="max-sm:hidden">Save</span>
    </span>
  )
}
