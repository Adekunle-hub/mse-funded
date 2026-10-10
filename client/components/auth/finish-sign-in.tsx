"use client"

import { LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

import { useFinishSignIn } from "@/hooks/use-auth"
import { getCurrentUser } from "@/lib/api/auth"
import { routes } from "@/lib/routes"

export function FinishSignIn() {
  const router = useRouter()
  const finishSignIn = useFinishSignIn()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    getCurrentUser()
      .then((user) => (user ? finishSignIn(user) : router.replace(`${routes.login}?error=google`)))
      .catch(() => router.replace(`${routes.login}?error=google`))
  }, [finishSignIn, router])

  return (
    <p role="status" className="flex items-center gap-2 text-ink-muted sm:justify-center">
      <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      Signing you in…
    </p>
  )
}
