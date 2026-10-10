import { ApiError, apiFetch } from "@/lib/api/client"

export type User = { id: string; name: string; email: string; isAdmin: boolean }
export type LoginInput = { email: string; password: string }
export type SignupInput = LoginInput & { name: string }

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { user } = await apiFetch<{ user: User }>("/auth/me")
    return user
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export async function login(input: LoginInput): Promise<User> {
  const { user } = await apiFetch<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify(input) })
  return user
}

export async function signup(input: SignupInput): Promise<User> {
  const { user } = await apiFetch<{ user: User }>("/auth/signup", { method: "POST", body: JSON.stringify(input) })
  return user
}

export async function forgotPassword(email: string): Promise<void> {
  await apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) })
}

export async function resetPassword(input: { token: string; password: string }): Promise<void> {
  await apiFetch("/auth/reset-password", { method: "POST", body: JSON.stringify(input) })
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" })
}
