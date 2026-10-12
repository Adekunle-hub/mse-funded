"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Camera } from "lucide-react"
import { useRef, type ChangeEvent } from "react"

import { UserAvatar } from "@/components/auth/user-avatar"
import { removeAvatar, uploadAvatar, type User } from "@/lib/api/auth"
import { queryKeys } from "@/lib/query-keys"
import { cn } from "@/lib/utils"

const PICTURE_SIZE = 320
const MAX_CHOSEN_BYTES = 10_000_000

async function squarePicture(file: File): Promise<Blob> {
  const image = await createImageBitmap(file)
  const side = Math.min(image.width, image.height)
  const canvas = document.createElement("canvas")
  canvas.width = PICTURE_SIZE
  canvas.height = PICTURE_SIZE
  canvas
    .getContext("2d")!
    .drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, PICTURE_SIZE, PICTURE_SIZE)
  image.close()

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("We couldn't read that picture"))),
      "image/jpeg",
      0.88
    )
  )
}

export function AvatarEditor({ user, className }: { user: User; className?: string }) {
  const queryClient = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const onSaved = (updated: User) => queryClient.setQueryData(queryKeys.currentUser, updated)

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (!file.type.startsWith("image/")) throw new Error("Choose a picture file")
      if (file.size > MAX_CHOSEN_BYTES) throw new Error("Choose a picture under 10 MB")
      return uploadAvatar(await squarePicture(file))
    },
    onSuccess: onSaved,
  })
  const remove = useMutation({ mutationFn: removeAvatar, onSuccess: onSaved })
  const busy = upload.isPending || remove.isPending
  const error = upload.error ?? remove.error

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (file) upload.mutate(file)
  }

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      <div className="relative">
        <UserAvatar
          name={user.name}
          imageUrl={user.avatarUrl}
          size={88}
          className={cn("border-4 border-surface", busy && "opacity-60")}
        />
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="absolute -right-2 -bottom-2 inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-hairline bg-surface text-ink shadow-sm hover:bg-muted-bg disabled:cursor-wait"
        >
          <Camera aria-hidden="true" className="size-4" />
          <span className="sr-only">{user.avatarUrl ? "Change your photo" : "Add a photo"}</span>
        </button>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="sr-only"
          tabIndex={-1}
        />
      </div>
      {user.avatarUrl && !busy && (
        <button
          type="button"
          onClick={() => remove.mutate()}
          className="cursor-pointer type-body-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Remove photo
        </button>
      )}
      {busy && <p className="type-body-sm text-ink-muted">{upload.isPending ? "Uploading…" : "Removing…"}</p>}
      {error && <p className="max-w-56 type-body-sm text-error">{error.message}</p>}
    </div>
  )
}
