export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? (
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000"
);