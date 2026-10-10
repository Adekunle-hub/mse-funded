"use client"

import { Menu } from "@base-ui/react/menu"
import { Ellipsis } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useRemoveSaved, useUpdateSaved } from "@/hooks/use-saved"
import type { SavedScholarship } from "@/lib/types/saved"

const itemClass =
  "flex h-12 cursor-pointer items-center px-4 text-ink outline-none data-highlighted:bg-muted-bg"

export function SavedCardMenu({ entry }: { entry: SavedScholarship }) {
  const remove = useRemoveSaved()
  const update = useUpdateSaved()
  const { id, title } = entry.scholarship

  return (
    <Menu.Root>
      <Menu.Trigger render={<Button variant="outline" size="icon" aria-label={`More actions for ${title}`} />}>
        <Ellipsis aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="top" align="end" sideOffset={8} className="z-50">
          <Menu.Popup className="min-w-52 overflow-hidden rounded-control border border-hairline bg-surface py-1 outline-none">
            <Menu.Item
              className={itemClass}
              onClick={() => update.mutate({ id, changes: { remindersOn: !entry.remindersOn } })}
            >
              {entry.remindersOn ? "Turn off reminders" : "Turn on reminders"}
            </Menu.Item>
            <Menu.Item className={itemClass} onClick={() => remove.mutate(entry)}>
              Remove
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
