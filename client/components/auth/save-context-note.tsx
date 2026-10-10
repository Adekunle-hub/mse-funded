import { Bookmark } from "lucide-react"

import { getScholarship } from "@/lib/api/scholarships"

type SaveContextNoteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function SaveContextNote({ searchParams }: SaveContextNoteProps) {
  const { save } = await searchParams
  const id = Array.isArray(save) ? save[0] : save
  if (!id) return null

  const scholarship = await getScholarship(id)
  if (!scholarship) return null

  return (
    <p className="flex gap-2 rounded-control bg-mint p-3 type-body-sm text-teal-ink">
      <Bookmark aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>
        Create an account to save <strong className="font-semibold">{scholarship.title}</strong>.
      </span>
    </p>
  )
}
