import { ApiError, apiFetch } from "@/lib/api/client"
import { apiConfig } from "@/lib/api/config"

export type LoginInput = { email: string; password: string }
export type SignupInput = LoginInput & { name: string }

export class InvalidCredentialsError extends Error {
  constructor() {
    super("That email and password don't match.")
    this.name = "InvalidCredentialsError"
  }
}

const post = (path: string, body: unknown) =>
  apiFetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

const mockDelay = () => new Promise((resolve) => setTimeout(resolve, 700))

export async function login(input: LoginInput) {
  if (apiConfig.useMock) return mockDelay()
  try {
    await post("/auth/login", input)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) throw new InvalidCredentialsError()
    throw error
  }
}

export async function signup(input: SignupInput) {
  if (apiConfig.useMock) return mockDelay()
  await post("/auth/signup", input)
}

export function googleSignInUrl(next: string) {
  return `${apiConfig.baseUrl}/auth/google?next=${encodeURIComponent(next)}`
}
