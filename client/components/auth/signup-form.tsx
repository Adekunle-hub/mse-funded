"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import type { FormEvent } from "react"

import { FormAlert } from "@/components/auth/form-alert"
import { GoogleButton, OrDivider } from "@/components/auth/google-button"
import { SubmitButton } from "@/components/auth/submit-button"
import { TextField } from "@/components/auth/text-field"
import { useFormFields } from "@/hooks/use-form-fields"
import { signup } from "@/lib/api/auth"
import {
  MIN_PASSWORD_LENGTH,
  safeNextPath,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/auth/validation"
import { routes } from "@/lib/routes"

export function SignupForm() {
  const router = useRouter()
  const nextPath = () => safeNextPath(routes.tracker)
  const { values, field, validateAll } = useFormFields(
    { name: "", email: "", password: "" },
    {
      name: validateName,
      email: validateEmail,
      password: (value) => validatePassword(value, { forSignup: true }),
    }
  )

  const submit = useMutation({
    mutationFn: signup,
    onSuccess: () => router.push(nextPath()),
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const firstInvalid = validateAll()
    if (firstInvalid) {
      event.currentTarget.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)?.focus()
      return
    }
    submit.mutate({ name: values.name.trim(), email: values.email.trim(), password: values.password })
  }

  return (
    <div className="flex flex-col gap-5">
      <GoogleButton next={nextPath} />
      <OrDivider />
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        {submit.isError && (
          <FormAlert message="We couldn't create your account. Check your connection and try again." />
        )}
        <TextField label="Full name" autoComplete="name" {...field("name")} />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="name@example.com"
          {...field("email")}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          hint={`At least ${MIN_PASSWORD_LENGTH} characters`}
          {...field("password")}
        />
        <SubmitButton pending={submit.isPending} label="Create account" pendingLabel="Creating account…" />
      </form>
    </div>
  )
}
