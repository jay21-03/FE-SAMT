export const env = {
  apiUrl: (import.meta as any)?.env?.VITE_API_URL ?? "http://localhost:9080",
  requestTimeoutMs: 8_000,
}
