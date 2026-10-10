"use client"

import { useMutation } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { FormEvent } from "react"

import { FormAlert } from "@/components/auth/form-alert"
import { GoogleButton, OrDivider } from "@/components/auth/google-button"
import { SubmitButton } from "@/components/auth/submit-button"
import { TextField } from "@/components/auth/text-field"
import { useFormFields } from "@/hooks/use-form-fields"
import { InvalidCredentialsError, login } from "@/lib/api/auth"
import { safeNextPath, validateEmail, validatePassword } from "@/lib/auth/validation"
import { routes } from "@/lib/routes"

export function LoginForm() {
  const router = useRouter()
  const nextPath = () => safeNextPath(routes.tracker)
  const { values, field, validateAll } = useFormFields(
    { email: "", password: "" },
    { email: validateEmail, password: (value) => validatePassword(value, { forSignup: false }) }
  )

  const submit = useMutation({
    mutationFn: login,
    onSuccess: () => router.push(nextPath()),
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const firstInvalid = validateAll()
    if (firstInvalid) {
      event.currentTarget.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)?.focus()
      return
    }
    submit.mutate({ email: values.email.trim(), password: values.password })
  }

  const errorMessage = submit.error
    ? submit.error instanceof InvalidCredentialsError
      ? "That email and password don't match. Try again or reset your password."
      : "We couldn't log you in. Check your connection and try again."
    : null

  return (
    <div className="flex flex-col gap-5">
      <GoogleButton next={nextPath} />
      <OrDivider />
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        {errorMessage && <FormAlert message={errorMessage} />}
        <TextField label="Email" type="email" autoComplete="email" inputMode="email" {...field("email")} />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          labelAside={
            <Link href={routes.forgotPassword} className="inline-flex h-10 items-center type-body-sm font-medium text-teal">
              Forgot password?
            </Link>
          }
          {...field("password")}
        />
        <SubmitButton pending={submit.isPending} label="Log in" pendingLabel="Logging in…" />
      </form>
    </div>
  )
}
