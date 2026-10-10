"use client"

import { useMutation } from "@tanstack/react-query"
import { Check, CircleAlert, Flag } from "lucide-react"
import { useId, useState, useSyncExternalStore, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { reportReasons, submitListingReport, type ReportReason } from "@/lib/api/reports"
import { formatDate } from "@/lib/format/date"
import { markReported, reportedAt, subscribeReported } from "@/lib/scholarships/reported-listings"
import { cn } from "@/lib/utils"

type ReportDialogProps = {
  scholarshipId: string
  layout: "link" | "row"
}

export function ReportDialog({ scholarshipId, layout }: ReportDialogProps) {
  const previousReport = useSyncExternalStore(
    subscribeReported,
    () => reportedAt(scholarshipId),
    () => null
  )
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState("")
  const fieldName = useId()

  const report = useMutation({
    mutationFn: () => submitListingReport(scholarshipId, { reason: reason!, details: details.trim() || undefined }),
    onSuccess: () => markReported(scholarshipId),
  })

  const triggerClass = cn(
    "inline-flex items-center gap-2 type-body-sm font-medium text-ink-muted hover:text-ink",
    layout === "row" ? "h-12 w-full border-y border-hairline" : "h-10"
  )

  if (previousReport && !open) {
    return (
      <p className={cn(triggerClass, "font-normal")}>
        <Flag aria-hidden="true" className="size-4 shrink-0" />
        You reported this on {formatDate(previousReport, { withYear: false })}. We&apos;re checking it.
      </p>
    )
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setReason(null)
      setDetails("")
      report.reset()
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (reason) report.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<button type="button" className={triggerClass} />}>
        <Flag aria-hidden="true" className="size-4 shrink-0" />
        {layout === "row" ? "Report a problem with this listing" : "Report a problem"}
      </DialogTrigger>
      <DialogContent>
        {report.isSuccess ? (
          <div className="flex flex-col items-start gap-3 py-2">
            <span className="inline-flex size-12 items-center justify-center rounded-md bg-mint text-teal-ink">
              <Check aria-hidden="true" />
            </span>
            <DialogTitle>Thanks for telling us</DialogTitle>
            <DialogDescription>
              A person will check this within 1 working day. If we find a problem, we&apos;ll mark the listing
              for everyone.
            </DialogDescription>
            <DialogClose render={<Button variant="outline" className="mt-2 w-full sm:w-auto" />}>Done</DialogClose>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col">
            <DialogTitle>What&apos;s wrong with this listing?</DialogTitle>
            <fieldset className="mt-2">
              <legend className="sr-only">Choose a reason</legend>
              {reportReasons.map((option) => (
                <label key={option.value} className="flex h-12 cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name={fieldName}
                    value={option.value}
                    checked={reason === option.value}
                    onChange={() => setReason(option.value)}
                    className="size-5 shrink-0 cursor-pointer appearance-none rounded-full border border-border-control checked:border-[6px] checked:border-ink"
                  />
                  {option.label}
                </label>
              ))}
            </fieldset>
            <label className="mt-3 flex flex-col gap-2">
              <span className="type-label">Tell us more (optional)</span>
              <textarea
                rows={3}
                value={details}
                maxLength={1000}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="For example: the page says the deadline moved to 30 Nov."
                className="resize-none rounded-control border border-border-control px-4 py-3 text-ink placeholder:text-ink-muted"
              />
            </label>
            {report.isError && (
              <p role="alert" className="mt-3 flex items-center gap-1.5 type-body-sm text-error">
                <CircleAlert aria-hidden="true" className="size-4" />
                We couldn&apos;t send your report. Try again.
              </p>
            )}
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <DialogClose render={<Button variant="text" size="inline" className="h-12 px-3" />}>Cancel</DialogClose>
              <Button type="submit" variant="primary" disabled={!reason || report.isPending}>
                {report.isPending ? "Sending…" : "Send report"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
