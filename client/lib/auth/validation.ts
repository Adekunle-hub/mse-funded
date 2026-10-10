const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const MIN_PASSWORD_LENGTH = 8

export function validateEmail(value: string) {
  if (!value.trim()) return "Enter your email address"
  if (!EMAIL_PATTERN.test(value.trim())) return "Enter an email like name@example.com"
  return undefined
}

export function validatePassword(value: string, { forSignup }: { forSignup: boolean }) {
  if (!value) return "Enter your password"
  if (forSignup && value.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters`
  }
  return undefined
}

export function validateName(value: string) {
  return value.trim() ? undefined : "Enter your full name"
}

export function safeNextPath(fallback: string) {
  if (typeof window === "undefined") return fallback
  const next = new URLSearchParams(window.location.search).get("next")
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback
}
