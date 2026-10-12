"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ExternalLink } from "lucide-react"
import { useState, type FormEvent } from "react"

import { Field, fieldClass, Loading, Message, toDateInput } from "@/components/admin/admin-ui"
import { Button } from "@/components/ui/button"
import { adminApi, type HeldListing } from "@/lib/api/admin"
import { queryKeys } from "@/lib/query-keys"

const levelLabels: Record<HeldListing["level"], string> = { MSC: "MSc", PHD: "PhD", MSC_PHD: "MSc and PhD" }
const fundingLabels: Record<HeldListing["fundingType"], string> = {
  FULLY_FUNDED: "Fully funded",
  TUITION_ONLY: "Tuition only",
  STIPEND_ONLY: "Stipend only",
  PARTIAL: "Partly funded",
}

function HeldCard({ item }: { item: HeldListing }) {
  const queryClient = useQueryClient()
  const [deadline, setDeadline] = useState(toDateInput(item.deadline))
  const [officialUrl, setOfficialUrl] = useState(item.officialUrl ?? item.pageUrl)

  const refresh = () =>
    Promise.all(
      [queryKeys.adminReview, queryKeys.adminSummary, queryKeys.adminListings].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      )
    )
  const publish = useMutation({
    mutationFn: () => adminApi.publish(item.id, { officialUrl, deadline: deadline || null }),
    onSuccess: refresh,
  })
  const reject = useMutation({ mutationFn: () => adminApi.reject(item.id), onSuccess: refresh })
  const busy = publish.isPending || reject.isPending
  const error = publish.error ?? reject.error

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    publish.mutate()
  }

  return (
    <li className="rounded-md border border-hairline p-4 sm:p-5">
      <h2 className="type-heading-3">{item.title}</h2>
      <p className="mt-1 type-body-sm text-ink-muted">
        {[item.institution, item.country, levelLabels[item.level], fundingLabels[item.fundingType]]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {item.note && (
        <p className="mt-3 rounded-md bg-amber-bg px-3 py-2 type-body-sm text-amber-ink">Held because: {item.note}</p>
      )}
      <p className="mt-3 text-ink">{item.fundingSummary}</p>
      <p className="mt-1 type-body-sm text-ink-muted">
        Open to Nigerians: {item.openToNigerians === null ? "not stated" : item.openToNigerians ? "yes" : "no"}
      </p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 type-body-sm">
        {item.officialUrl && (
          <a
            href={item.officialUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-teal hover:text-teal-hover"
          >
            Official link <ExternalLink aria-hidden="true" className="size-3.5" />
          </a>
        )}
        <a
          href={item.pageUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-teal hover:text-teal-hover"
        >
          Page we read <ExternalLink aria-hidden="true" className="size-3.5" />
        </a>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-[12rem_1fr]">
        <Field label="Deadline (leave empty if none)">
          <input
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label="Official link">
          <input
            type="url"
            required
            value={officialUrl}
            onChange={(event) => setOfficialUrl(event.target.value)}
            className={fieldClass}
          />
        </Field>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" variant="primary" size="sm" disabled={busy}>
            {publish.isPending ? "Publishing…" : "Publish"}
          </Button>
          <Button type="button" size="sm" disabled={busy} onClick={() => reject.mutate()}>
            {reject.isPending ? "Rejecting…" : "Reject"}
          </Button>
        </div>
        {error && <Message tone="error">{error.message}</Message>}
      </form>
    </li>
  )
}

export function ReviewQueue() {
  const held = useQuery({ queryKey: queryKeys.adminReview, queryFn: adminApi.held })

  if (held.isPending) return <Loading />
  if (held.isError)
    return <Message tone="error">We couldn&apos;t load the review queue. Try again in a moment.</Message>
  if (held.data.length === 0)
    return <Message>Nothing is waiting for review. New items appear here when a check needs a person.</Message>

  return (
    <>
      <p className="text-ink-muted">
        Open the links, check the details are right, then publish or reject. Publishing puts the listing on the site
        straight away.
      </p>
      <ul className="mt-4 flex flex-col gap-4">
        {held.data.map((item) => (
          <HeldCard key={item.id} item={item} />
        ))}
      </ul>
    </>
  )
}
