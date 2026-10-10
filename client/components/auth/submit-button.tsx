import { LoaderCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

type SubmitButtonProps = {
  pending: boolean
  label: string
  pendingLabel: string
}

export function SubmitButton({ pending, label, pendingLabel }: SubmitButtonProps) {
  return (
    <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending} aria-busy={pending}>
      {pending && <LoaderCircle aria-hidden="true" className="animate-spin" />}
      {pending ? pendingLabel : label}
    </Button>
  )
}
