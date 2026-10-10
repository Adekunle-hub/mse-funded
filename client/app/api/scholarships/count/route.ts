import type { NextRequest } from "next/server"

import { countScholarships } from "@/lib/api/scholarships"
import { parseSearchFilters } from "@/lib/scholarships/filters"

export async function GET(request: NextRequest) {
  const total = await countScholarships(parseSearchFilters(request.nextUrl.searchParams))
  return Response.json({ total })
}
