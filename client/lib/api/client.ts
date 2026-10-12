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

type RequestOptions = RequestInit & { query?: QueryParams }

async function request(path: string, { query, headers, ...init }: RequestOptions) {
  const isJson = typeof init.body === "string"
  const send = () =>
    fetch(buildUrl(path, query), {
      credentials: "include",
      ...init,
      headers: { Accept: "application/json", ...(isJson ? { "Content-Type": "application/json" } : {}), ...headers },
    })

  const response = await send()
  if (response.status === 401 && !pathsWithoutRefresh.includes(path) && (await refreshSession())) {
    return send()
  }
  return response
}

async function toApiError(response: Response) {
  const body = await readBody(response)
  const raw =
    typeof body === "object" && body !== null && "message" in body ? (body as { message: unknown }).message : null
  const message = Array.isArray(raw) ? raw.join(". ") : raw ? String(raw) : response.statusText
  return new ApiError(response.status, message, body)
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await request(path, options)
  if (!response.ok) throw await toApiError(response)
  return (await readBody(response)) as T
}

export async function apiStream(path: string, options: RequestOptions, onText: (text: string) => void) {
  const response = await request(path, options)
  if (!response.ok || !response.body) throw await toApiError(response)

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) return
    onText(value)
  }
}

export function apiUrl(path: string) {
  return buildUrl(path).toString()
}
