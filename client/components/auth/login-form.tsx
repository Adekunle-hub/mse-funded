"use client"

import { useMutation } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, type FormEvent } from "react"

import { FormAlert } from "@/components/auth/form-alert"
import { GoogleSignIn, GoogleSignInError } from "@/components/auth/google-sign-in"
import { SubmitButton } from "@/components/auth/submit-button"
import { TextField } from "@/components/auth/text-field"
import { useCurrentUser, useFinishSignIn } from "@/hooks/use-auth"
import { useFormFields } from "@/hooks/use-form-fields"
import { login } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { safeNextPath, validateEmail, validatePassword } from "@/lib/auth/validation"
import { routes } from "@/lib/routes"

function errorMessage(error: Error) {
  if (error instanceof ApiError && error.status === 401) return "That email and password don't match. Try again."
  if (error instanceof ApiError && error.status === 429) return "Too many attempts. Wait a minute and try again."
  return "We couldn't log you in. Check your connection and try again."
}

export function LoginForm() {
  const router = useRouter()
  const { user } = useCurrentUser()
  const finishSignIn = useFinishSignIn()
  const { values, field, validateAll } = useFormFields(
    { email: "", password: "" },
    {
      email: validateEmail,
      password: (value) => validatePassword(value, { forSignup: false }),
    }
  )

  const submit = useMutation({ mutationFn: login, onSuccess: finishSignIn })

  useEffect(() => {
    if (user && !submit.isPending && !submit.isSuccess) router.replace(safeNextPath(routes.tracker))
  }, [user, submit.isPending, submit.isSuccess, router])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const firstInvalid = validateAll()
    if (firstInvalid) {
      event.currentTarget.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)?.focus()
      return
    }
    submit.mutate({ email: values.email.trim(), password: values.password })
  }

  return (
    <>
      <GoogleSignInError />
      <GoogleSignIn />
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        {submit.error && <FormAlert message={errorMessage(submit.error)} />}
        <TextField label="Email" type="email" autoComplete="email" inputMode="email" {...field("email")} />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          labelAside={
            <Link
              href={routes.forgotPassword}
              className="type-body-sm font-medium text-teal underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          }
          {...field("password")}
        />
        <SubmitButton pending={submit.isPending || submit.isSuccess} label="Log in" pendingLabel="Logging in…" />
      </form>
    </>
  )
}
