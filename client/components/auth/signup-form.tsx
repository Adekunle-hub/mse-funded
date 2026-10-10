"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, type FormEvent } from "react"

import { FormAlert } from "@/components/auth/form-alert"
import { GoogleSignIn } from "@/components/auth/google-sign-in"
import { SubmitButton } from "@/components/auth/submit-button"
import { TextField } from "@/components/auth/text-field"
import { useCurrentUser, useFinishSignIn } from "@/hooks/use-auth"
import { useFormFields } from "@/hooks/use-form-fields"
import { signup } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { MIN_PASSWORD_LENGTH, safeNextPath, validateEmail, validateName, validatePassword } from "@/lib/auth/validation"
import { routes } from "@/lib/routes"

function errorMessage(error: Error) {
  if (error instanceof ApiError && (error.status === 400 || error.status === 409)) return error.message
  if (error instanceof ApiError && error.status === 429) return "Too many attempts. Wait a minute and try again."
  return "We couldn't create your account. Check your connection and try again."
}

export function SignupForm() {
  const router = useRouter()
  const { user } = useCurrentUser()
  const finishSignIn = useFinishSignIn()
  const { values, field, validateAll } = useFormFields(
    { name: "", email: "", password: "" },
    {
      name: validateName,
      email: validateEmail,
      password: (value) => validatePassword(value, { forSignup: true }),
    }
  )

  const submit = useMutation({ mutationFn: signup, onSuccess: finishSignIn })

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
    submit.mutate({
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
    })
  }

  return (
    <>
      <GoogleSignIn />
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        {submit.error && <FormAlert message={errorMessage(submit.error)} />}
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
        <SubmitButton
          pending={submit.isPending || submit.isSuccess}
          label="Create account"
          pendingLabel="Creating account…"
        />
      </form>
    </>
  )
}
