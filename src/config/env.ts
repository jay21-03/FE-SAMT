export const env = {
  apiUrl: (import.meta as any)?.env?.VITE_API_URL ?? "http://localhost:9080",
  requestTimeoutMs: Number((import.meta as any)?.env?.VITE_REQUEST_TIMEOUT_MS ?? 8_000),
}
