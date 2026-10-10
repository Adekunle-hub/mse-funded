import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control border border-transparent type-button whitespace-nowrap transition-colors duration-[120ms] select-none disabled:pointer-events-none disabled:bg-muted-bg disabled:text-muted-ink [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-teal text-white hover:bg-teal-hover active:bg-teal-hover",
        outline:
          "border-border-control bg-surface text-ink hover:bg-muted-bg active:bg-muted-bg",
        ghost: "text-ink hover:bg-muted-bg active:bg-muted-bg",
        text: "text-teal hover:text-teal-hover",
      },
      size: {
        lg: "h-12 px-6",
        md: "h-12 px-5 sm:h-10 sm:px-4",
        sm: "h-9 px-3.5",
        icon: "size-12 sm:size-10",
        inline: "px-1",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "md",
    },
  }
)

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants, type ButtonProps }
