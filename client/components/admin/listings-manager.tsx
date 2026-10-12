"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState, type FormEvent } from "react"

import { Field, fieldClass, Loading, Message, Pager, toDateInput } from "@/components/admin/admin-ui"
import { Button } from "@/components/ui/button"
import { adminApi, type AdminListing, type ListingChanges, type ListingStatus } from "@/lib/api/admin"
import { formatDate } from "@/lib/format/date"
import { queryKeys } from "@/lib/query-keys"
import { routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

const statusLabels: Record<ListingStatus, string> = {
  PUBLISHED: "Live",
  UNDER_REVIEW: "Live, with review badge",
  REJECTED: "Hidden",
  DRAFT: "Draft",
}

const editableStatuses = ["PUBLISHED", "UNDER_REVIEW", "REJECTED"] as const

function EditForm({ listing, onDone }: { listing: AdminListing; onDone: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(listing.name)
  const [deadline, setDeadline] = useState(toDateInput(listing.deadline))
  const [officialUrl, setOfficialUrl] = useState(listing.officialUrl)
  const [status, setStatus] = useState<ListingChanges["status"]>(
    listing.status === "DRAFT" ? "REJECTED" : listing.status
  )

  const save = useMutation({
    mutationFn: () => adminApi.updateListing(listing.id, { name, officialUrl, deadline: deadline || null, status }),
    onSuccess: async () => {
      await Promise.all(
        [queryKeys.adminListings, queryKeys.adminSummary].map((queryKey) => queryClient.invalidateQueries({ queryKey }))
      )
      onDone()
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-3 border-t border-hairline pt-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="Name">
          <input
            required
            minLength={3}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={fieldClass}
          />
        </Field>
      </div>
      <Field label="Deadline (leave empty if none)">
        <input
          type="date"
          value={deadline}
          onChange={(event) => setDeadline(event.target.value)}
          className={fieldClass}
        />
      </Field>
      <Field label="Shown on the site as">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as ListingChanges["status"])}
          className={cn(fieldClass, "cursor-pointer")}
        >
          {editableStatuses.map((value) => (
            <option key={value} value={value}>
              {statusLabels[value]}
            </option>
          ))}
        </select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Official link">
          <input
            type="url"
            required
            value={officialUrl}
            onChange={(event) => setOfficialUrl(event.target.value)}
            className={fieldClass}
          />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" variant="primary" size="sm" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" size="sm" onClick={onDone}>
          Cancel
        </Button>
      </div>
      {save.isError && <Message tone="error">{save.error.message}</Message>}
    </form>
  )
}

function ListingRow({ listing }: { listing: AdminListing }) {
  const [editing, setEditing] = useState(false)
  const hidden = listing.status === "REJECTED" || listing.status === "DRAFT"

  return (
    <li className="rounded-md border border-hairline p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {hidden ? (
            <p className="type-label text-ink">{listing.name}</p>
          ) : (
            <Link
              href={routes.scholarship(listing.slug)}
              target="_blank"
              className="type-label text-ink hover:text-teal"
            >
              {listing.name}
            </Link>
          )}
          <p className="mt-1 type-body-sm text-ink-muted">
            {listing.institution} · {listing.country} ·{" "}
            {listing.deadline ? `deadline ${formatDate(listing.deadline)}` : "no deadline"}
          </p>
          <p className="mt-2 flex flex-wrap gap-2 type-body-sm">
            <span
              className={cn(
                "rounded-full px-2 py-0.5",
                hidden ? "bg-muted-bg text-ink-muted" : "bg-mint text-teal-ink"
              )}
            >
              {statusLabels[listing.status]}
            </span>
            {listing.openReports > 0 && (
              <span className="rounded-full bg-amber-bg px-2 py-0.5 text-amber-ink">
                {listing.openReports} open {listing.openReports === 1 ? "report" : "reports"}
              </span>
            )}
          </p>
          {listing.reviewNote && <p className="mt-2 type-body-sm text-ink-muted">Note: {listing.reviewNote}</p>}
        </div>
        {!editing && (
          <Button size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>
      {editing && <EditForm listing={listing} onDone={() => setEditing(false)} />}
    </li>
  )
}

export function ListingsManager() {
  const searchParams = useSearchParams()
  const [draft, setDraft] = useState(searchParams.get("q") ?? "")
  const [q, setQ] = useState(draft)
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)

  const listings = useQuery({
    queryKey: [...queryKeys.adminListings, q, status, page],
    queryFn: () => adminApi.listings({ q, status, page }),
    placeholderData: keepPreviousData,
  })

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    setQ(draft.trim())
    setPage(1)
  }

  return (
    <>
      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1">
          <Field label="Search by name or institution">
            <input
              type="search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className={fieldClass}
            />
          </Field>
        </div>
        <div className="w-full sm:w-56">
          <Field label="Show">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                setPage(1)
              }}
              className={cn(fieldClass, "cursor-pointer")}
            >
              <option value="">All listings</option>
              {editableStatuses.map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Button type="submit" size="sm" className="h-10">
          Search
        </Button>
      </form>

      <div className="mt-4">
        {listings.isPending ? (
          <Loading />
        ) : listings.isError ? (
          <Message tone="error">We couldn&apos;t load the listings. Try again in a moment.</Message>
        ) : listings.data.items.length === 0 ? (
          <Message>No listings match.</Message>
        ) : (
          <>
            <p className="type-body-sm text-ink-muted">{listings.data.total} listings</p>
            <ul className="mt-2 flex flex-col gap-3">
              {listings.data.items.map((listing) => (
                <ListingRow key={listing.id} listing={listing} />
              ))}
            </ul>
            <Pager page={listings.data.page} pageCount={listings.data.pageCount} onChange={setPage} />
          </>
        )}
      </div>
    </>
  )
}
