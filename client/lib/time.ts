import { cacheLife } from "next/cache"

export async function getRenderTime(): Promise<Date> {
  "use cache"
  cacheLife("hours")
  return new Date()
}
