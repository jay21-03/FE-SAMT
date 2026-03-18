export function unwrapApiData<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data
  }
  return payload as T
}
