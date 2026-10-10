import { apiConfig } from "@/lib/api/config"

const API_BASE_URL = apiConfig.baseUrl

type QueryValue = string | number | boolean | undefined | null
export type QueryParams = Record<string, QueryValue | QueryValue[]>

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown
  ) {
    super(message)
    this.name = "ApiError"
  }
}

function buildUrl(path: string, query?: QueryParams) {
  const url = new URL(path.replace(/^\//, ""), API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`)
  for (const [key, raw] of Object.entries(query ?? {})) {
    const values = Array.isArray(raw) ? raw : [raw]
    for (const value of values) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value))
      }
    }
  }
  return url
}

async function readBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""
  return contentType.includes("application/json") ? response.json() : response.text()
}

export async function apiFetch<T>(
  path: string,
  { query, headers, ...init }: RequestInit & { query?: QueryParams } = {}
): Promise<T> {
  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers: { Accept: "application/json", ...headers },
  })

  const body = await readBody(response)

  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "message" in body
        ? String((body as { message: unknown }).message)
        : response.statusText
    throw new ApiError(response.status, message, body)
  }

  return body as T
}
