"use client"

import { useState } from "react"

type Validators<T extends string> = Record<T, (value: string) => string | undefined>

export function useFormFields<T extends string>(initial: Record<T, string>, validators: Validators<T>) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Partial<Record<T, string>>>({})

  const validate = (name: T, value = values[name]) => {
    const error = validators[name](value)
    setErrors((current) => ({ ...current, [name]: error }))
    return error
  }

  const field = (name: T) => ({
    name,
    value: values[name],
    error: errors[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value
      setValues((current) => ({ ...current, [name]: value }))
      if (errors[name]) setErrors((current) => ({ ...current, [name]: validators[name](value) }))
    },
    onBlur: () => {
      if (values[name]) validate(name)
    },
  })

  const validateAll = () => {
    const names = Object.keys(validators) as T[]
    const next = Object.fromEntries(names.map((name) => [name, validators[name](values[name])])) as Partial<
      Record<T, string>
    >
    setErrors(next)
    return names.find((name) => next[name])
  }

  return { values, field, validateAll }
}
