"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"

import { Loading, Message } from "@/components/admin/admin-ui"
import { Button, buttonVariants } from "@/components/ui/button"
import { adminApi, type OpenReport } from "@/lib/api/admin"
import { reportReasons } from "@/lib/api/reports"
import { formatDate } from "@/lib/format/date"
import { queryKeys } from "@/lib/query-keys"
import { routes } from "@/lib/routes"

function reasonLabel(reason: string) {
  return reportReasons.find((option) => option.value === reason)?.label ?? reason
}

function ReportCard({ report }: { report: OpenReport }) {
  const queryClient = useQueryClient()
  const resolve = useMutation({
    mutationFn: () => adminApi.resolveReport(report.id),
    onSuccess: () =>
      Promise.all(
        [queryKeys.adminReports, queryKeys.adminSummary, queryKeys.adminListings].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey })
        )
      ),
  })
  const { scholarship } = report

  return (
    <li className="rounded-md border border-hairline p-4 sm:p-5">
      <p className="type-body-sm text-ink-muted">Reported {formatDate(report.createdAt)}</p>
      <h2 className="mt-1 type-heading-3">{reasonLabel(report.reason)}</h2>
      {report.details && <p className="mt-2 text-ink">&ldquo;{report.details}&rdquo;</p>}
      <p className="mt-3 type-body-sm text-ink-muted">
        On{" "}
        <Link href={routes.scholarship(scholarship.slug)} target="_blank" className="text-teal hover:text-teal-hover">
          {scholarship.name}
        </Link>{" "}
        · {scholarship.institution}
        {scholarship.deadline && ` · deadline ${formatDate(scholarship.deadline)}`}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`${routes.adminListings}?q=${encodeURIComponent(scholarship.name)}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Fix the listing
        </Link>
        <Button size="sm" variant="primary" disabled={resolve.isPending} onClick={() => resolve.mutate()}>
          {resolve.isPending ? "Saving…" : "Mark as resolved"}
        </Button>
      </div>
      {resolve.isError && <Message tone="error">{resolve.error.message}</Message>}
    </li>
  )
}

export function ReportsList() {
  const reports = useQuery({ queryKey: queryKeys.adminReports, queryFn: adminApi.reports })

  if (reports.isPending) return <Loading />
  if (reports.isError) return <Message tone="error">We couldn&apos;t load the reports. Try again in a moment.</Message>
  if (reports.data.length === 0)
    return <Message>No open reports. When a student flags a listing, it shows up here.</Message>

  return (
    <ul className="flex flex-col gap-4">
      {reports.data.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </ul>
  )
}
