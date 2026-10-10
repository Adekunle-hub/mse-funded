import { apiBaseUrl } from "@/lib/api/config"

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
  const url = new URL(path.replace(/^\//, ""), apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`)
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

const pathsWithoutRefresh = [
  "/auth/login",
  "/auth/signup",
  "/auth/refresh",
  "/auth/logout",
  "/auth/forgot-password",
  "/auth/reset-password",
]
let refreshing: Promise<boolean> | null = null

function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(buildUrl("/auth/refresh"), { method: "POST", credentials: "include" })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

export async function apiFetch<T>(
  path: string,
  { query, headers, ...init }: RequestInit & { query?: QueryParams } = {}
): Promise<T> {
  const send = () =>
    fetch(buildUrl(path, query), {
      credentials: "include",
      ...init,
      headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...headers },
    })

  let response = await send()
  if (response.status === 401 && !pathsWithoutRefresh.includes(path) && (await refreshSession())) {
    response = await send()
  }

  const body = await readBody(response)

  if (!response.ok) {
    const raw = typeof body === "object" && body !== null && "message" in body ? (body as { message: unknown }).message : null
    const message = Array.isArray(raw) ? raw.join(". ") : raw ? String(raw) : response.statusText
    throw new ApiError(response.status, message, body)
  }

  return body as T
}
