import { timingSafeEqual } from "node:crypto"

import { revalidateTag } from "next/cache"
import type { NextRequest } from "next/server"

function isAuthorized(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET
  const received = request.headers.get("x-revalidate-secret")
  if (!expected || !received || expected.length !== received.length) return false
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received))
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ message: "Not allowed" }, { status: 401 })
  }

  revalidateTag("scholarships", { expire: 0 })
  return Response.json({ revalidated: true })
}
