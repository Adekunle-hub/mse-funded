"use client"

import { useMutation } from "@tanstack/react-query"
import { CircleCheck } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { FormEvent } from "react"

import { FormAlert } from "@/components/auth/form-alert"
import { SubmitButton } from "@/components/auth/submit-button"
import { TextField } from "@/components/auth/text-field"
import { buttonVariants } from "@/components/ui/button"
import { useFormFields } from "@/hooks/use-form-fields"
import { resetPassword } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { validatePassword } from "@/lib/auth/validation"
import { routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

function errorMessage(error: Error) {
  if (error instanceof ApiError && error.status === 400) return "This reset link is invalid or has expired. Ask for a new one."
  if (error instanceof ApiError && error.status === 429) return "Too many attempts. Wait a minute and try again."
  return "We couldn't change your password. Check your connection and try again."
}

export function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? ""
  const { values, field, validateAll } = useFormFields(
    { password: "" },
    { password: (value) => validatePassword(value, { forSignup: true }) }
  )
  const submit = useMutation({ mutationFn: resetPassword })

  if (!token) {
    return (
      <p className="text-ink-muted">
        This page needs the link from your email.{" "}
        <Link href={routes.forgotPassword} className="font-medium text-teal underline-offset-4 hover:underline">
          Ask for a new reset link
        </Link>
        .
      </p>
    )
  }

  if (submit.isSuccess) {
    return (
      <div className="flex flex-col gap-5">
        <div role="status" className="flex gap-3 rounded-control border border-teal/30 bg-mint p-4 text-teal-ink">
          <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p>Your password has been changed. For your safety, we&apos;ve logged you out on every device.</p>
        </div>
        <Link href={routes.login} className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full")}>
          Log in
        </Link>
      </div>
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (validateAll()) {
      event.currentTarget.querySelector<HTMLInputElement>('[name="password"]')?.focus()
      return
    }
    submit.mutate({ token, password: values.password })
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {submit.error && <FormAlert message={errorMessage(submit.error)} />}
      <TextField
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters"
        {...field("password")}
      />
      <SubmitButton pending={submit.isPending} label="Change password" pendingLabel="Changing…" />
    </form>
  )
}
