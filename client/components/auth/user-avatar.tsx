import Image from "next/image"

import { cn } from "@/lib/utils"

function avatarUrl(name: string) {
  const params = new URLSearchParams({
    seed: name,
    backgroundColor: "b9ffe8,fffded,ffc3e6",
    textColor: "061d29",
  })
  return `https://api.dicebear.com/7.x/initials/svg?${params}`
}

type UserAvatarProps = {
  name: string
  size?: number
  className?: string
}

export function UserAvatar({ name, size = 36, className }: UserAvatarProps) {
  return (
    <Image
      src={avatarUrl(name)}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={cn("shrink-0 rounded-md border border-hairline bg-mint", className)}
    />
  )
}
