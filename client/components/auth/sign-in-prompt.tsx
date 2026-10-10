import Link from "next/link"
import { Bookmark } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

type SignInPromptProps = {
  title: string
  description: string
  next: string
}

export function SignInPrompt({ title, description, next }: SignInPromptProps) {
  const query = `?next=${encodeURIComponent(next)}`

  return (
    <div className="mx-auto mt-8 flex max-w-100 flex-col items-center rounded-md border border-hairline px-6 py-10 text-center sm:mt-10 sm:px-8 sm:py-12">
      <span className="inline-flex size-14 items-center justify-center rounded-md bg-mint text-teal-ink">
        <Bookmark aria-hidden="true" className="size-6" />
      </span>
      <h2 className="mt-5 type-heading-2">{title}</h2>
      <p className="mt-2 text-ink-muted">{description}</p>
      <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href={`${routes.login}${query}`} className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}>
          Log in
        </Link>
        <Link href={`${routes.signup}${query}`} className={cn(buttonVariants({ variant: "primary" }), "w-full sm:w-auto")}>
          Create a free account
        </Link>
      </div>
    </div>
  )
}
