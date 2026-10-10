const apiUrl = process.env.NEXT_PUBLIC_API_URL

export const apiConfig = {
  baseUrl: apiUrl ?? "http://localhost:4000",
  useMock: !apiUrl,
} as const
