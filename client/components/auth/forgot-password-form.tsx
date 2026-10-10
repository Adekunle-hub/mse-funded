"use client"

import { useMutation } from "@tanstack/react-query"
import { MailCheck } from "lucide-react"
import type { FormEvent } from "react"

import { FormAlert } from "@/components/auth/form-alert"
import { SubmitButton } from "@/components/auth/submit-button"
import { TextField } from "@/components/auth/text-field"
import { useFormFields } from "@/hooks/use-form-fields"
import { forgotPassword } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { validateEmail } from "@/lib/auth/validation"

function errorMessage(error: Error) {
  if (error instanceof ApiError && error.status === 429) return "Too many requests. Wait a minute and try again."
  return "We couldn't send the link. Check your connection and try again."
}

export function ForgotPasswordForm() {
  const { values, field, validateAll } = useFormFields({ email: "" }, { email: validateEmail })
  const submit = useMutation({ mutationFn: forgotPassword })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (validateAll()) {
      event.currentTarget.querySelector<HTMLInputElement>('[name="email"]')?.focus()
      return
    }
    submit.mutate(values.email.trim())
  }

  if (submit.isSuccess) {
    return (
      <div role="status" className="flex gap-3 rounded-control border border-teal/30 bg-mint p-4 text-teal-ink">
        <MailCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p>
          If an account exists for <span className="font-medium">{values.email.trim()}</span>, we&apos;ve sent a link to
          choose a new password. It works once and expires in 30 minutes. Check your spam folder too.
        </p>
      </div>
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {submit.error && <FormAlert message={errorMessage(submit.error)} />}
      <TextField label="Email" type="email" autoComplete="email" inputMode="email" {...field("email")} />
      <SubmitButton pending={submit.isPending} label="Send reset link" pendingLabel="Sending…" />
    </form>
  )
}
