"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"

import { Field, fieldClass, Loading, Message, Pager } from "@/components/admin/admin-ui"
import { Button } from "@/components/ui/button"
import { adminApi, type AdminSource } from "@/lib/api/admin"
import { formatDate } from "@/lib/format/date"
import { queryKeys } from "@/lib/query-keys"
import { cn } from "@/lib/utils"

function AddSourceForm() {
  const queryClient = useQueryClient()
  const [url, setUrl] = useState("")
  const [name, setName] = useState("")
  const [isListing, setIsListing] = useState(false)

  const add = useMutation({
    mutationFn: () =>
      adminApi.addSource({ url: url.trim(), name: name.trim() || undefined, kind: isListing ? "LISTING" : "HTML" }),
    onSuccess: async () => {
      setUrl("")
      setName("")
      setIsListing(false)
      await Promise.all(
        [queryKeys.adminSources, queryKeys.adminSummary].map((queryKey) => queryClient.invalidateQueries({ queryKey }))
      )
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    add.mutate()
  }

  return (
    <section aria-labelledby="add-source-title" className="rounded-md border border-hairline p-4 sm:p-5">
      <h2 id="add-source-title" className="type-heading-3">
        Add a source
      </h2>
      <p className="mt-1 type-body-sm text-ink-muted">
        Paste a scholarship page or a page that lists many PhD posts. It is checked on the next crawl run.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Link">
          <input
            type="url"
            required
            placeholder="https://"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label="Name (optional)">
          <input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
        </Field>
        <label className="flex items-center gap-2 type-body-sm text-ink sm:col-span-2">
          <input
            type="checkbox"
            checked={isListing}
            onChange={(event) => setIsListing(event.target.checked)}
            className="size-4 accent-teal"
          />
          This page lists many posts, so follow its links to each post
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" variant="primary" size="sm" disabled={add.isPending}>
            {add.isPending ? "Adding…" : "Add source"}
          </Button>
        </div>
        {add.isError && <Message tone="error">{add.error.message}</Message>}
        {add.isSuccess && <Message>Added {add.data.name}. It will be crawled on the next run.</Message>}
      </form>
    </section>
  )
}

function RetryFailedPages() {
  const queryClient = useQueryClient()
  const summary = useQuery({ queryKey: queryKeys.adminSummary, queryFn: adminApi.summary })
  const retry = useMutation({
    mutationFn: adminApi.retryFailedPages,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminSummary }),
  })
  const failed = summary.data?.pages.failed ?? 0

  if (retry.isSuccess) {
    return <Message>{retry.data.count} pages will be read again by the AI on the next run.</Message>
  }
  if (failed === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md bg-amber-bg px-4 py-3 text-amber-ink">
      <p className="flex-1">
        {failed} {failed === 1 ? "page" : "pages"} could not be read by the AI.
      </p>
      <Button size="sm" disabled={retry.isPending} onClick={() => retry.mutate()}>
        {retry.isPending ? "Retrying…" : "Try them again"}
      </Button>
    </div>
  )
}

function SourceRow({ source }: { source: AdminSource }) {
  const queryClient = useQueryClient()
  const toggle = useMutation({
    mutationFn: () => adminApi.setSourceActive(source.id, !source.isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminSources }),
  })

  return (
    <li className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-hairline p-4">
      <div className="min-w-0 flex-1">
        <p className="type-label text-ink">{source.name}</p>
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="block truncate type-body-sm text-teal hover:text-teal-hover"
        >
          {source.url}
        </a>
        <p className="mt-2 flex flex-wrap gap-2 type-body-sm">
          <span
            className={cn(
              "rounded-full px-2 py-0.5",
              source.isActive ? "bg-mint text-teal-ink" : "bg-muted-bg text-ink-muted"
            )}
          >
            {source.isActive ? "Active" : "Paused"}
          </span>
          {source.kind === "LISTING" && (
            <span className="rounded-full bg-muted-bg px-2 py-0.5 text-ink-muted">Lists many posts</span>
          )}
          <span className="text-ink-muted">
            {source.lastCrawledAt ? `Last checked ${formatDate(source.lastCrawledAt)}` : "Not checked yet"}
          </span>
        </p>
        {source.lastError && <p className="mt-2 type-body-sm text-error">Last problem: {source.lastError}</p>}
      </div>
      <Button size="sm" disabled={toggle.isPending} onClick={() => toggle.mutate()}>
        {source.isActive ? "Pause" : "Resume"}
      </Button>
    </li>
  )
}

export function SourcesManager() {
  const [draft, setDraft] = useState("")
  const [q, setQ] = useState("")
  const [problems, setProblems] = useState(false)
  const [page, setPage] = useState(1)

  const sources = useQuery({
    queryKey: [...queryKeys.adminSources, q, problems, page],
    queryFn: () => adminApi.sources({ q, problems, page }),
    placeholderData: keepPreviousData,
  })

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    setQ(draft.trim())
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-6">
      <AddSourceForm />
      <RetryFailedPages />

      <section aria-labelledby="sources-title">
        <h2 id="sources-title" className="type-heading-3">
          All sources
        </h2>
        <form onSubmit={handleSearch} className="mt-3 flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1">
            <Field label="Search by name or link">
              <input
                type="search"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className={fieldClass}
              />
            </Field>
          </div>
          <Button type="submit" size="sm" className="h-10">
            Search
          </Button>
          <label className="flex h-10 items-center gap-2 type-body-sm text-ink">
            <input
              type="checkbox"
              checked={problems}
              onChange={(event) => {
                setProblems(event.target.checked)
                setPage(1)
              }}
              className="size-4 accent-teal"
            />
            Only sources with problems
          </label>
        </form>

        <div className="mt-4">
          {sources.isPending ? (
            <Loading />
          ) : sources.isError ? (
            <Message tone="error">We couldn&apos;t load the sources. Try again in a moment.</Message>
          ) : sources.data.items.length === 0 ? (
            <Message>No sources match.</Message>
          ) : (
            <>
              <p className="type-body-sm text-ink-muted">{sources.data.total} sources</p>
              <ul className="mt-2 flex flex-col gap-3">
                {sources.data.items.map((source) => (
                  <SourceRow key={source.id} source={source} />
                ))}
              </ul>
              <Pager page={sources.data.page} pageCount={sources.data.pageCount} onChange={setPage} />
            </>
          )}
        </div>
      </section>
    </div>
  )
}
