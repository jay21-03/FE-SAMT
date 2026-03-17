export interface TokenPair {
  accessToken: string
  refreshToken: string
}

const ACCESS_TOKEN_KEY = "access_token"
const REFRESH_TOKEN_KEY = "refresh_token"
const LEGACY_ACCESS_TOKEN_KEYS = ["accessToken", "token"]
const LEGACY_REFRESH_TOKEN_KEYS = ["refreshToken"]

let memoryTokens: TokenPair | null = null

function readToken(key: string): string | null {
  if (typeof localStorage === "undefined") return null
  return localStorage.getItem(key)
}

function writeToken(key: string, value: string): void {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(key, value)
}

function removeToken(key: string): void {
  if (typeof localStorage === "undefined") return
  localStorage.removeItem(key)
}

function readFirstAvailable(keys: string[]): string | null {
  for (const key of keys) {
    const value = readToken(key)
    if (value) return value
  }
  return null
}

export const tokenStore = {
  getAccessToken(): string | null {
    return readFirstAvailable([ACCESS_TOKEN_KEY, ...LEGACY_ACCESS_TOKEN_KEYS]) ?? memoryTokens?.accessToken ?? null
  },
  getRefreshToken(): string | null {
    return readFirstAvailable([REFRESH_TOKEN_KEY, ...LEGACY_REFRESH_TOKEN_KEYS]) ?? memoryTokens?.refreshToken ?? null
  },
  setTokens(tokens: TokenPair): void {
    memoryTokens = tokens
    writeToken(ACCESS_TOKEN_KEY, tokens.accessToken)
    writeToken(REFRESH_TOKEN_KEY, tokens.refreshToken)
  },
  clear(): void {
    memoryTokens = null
    removeToken(ACCESS_TOKEN_KEY)
    removeToken(REFRESH_TOKEN_KEY)
    LEGACY_ACCESS_TOKEN_KEYS.forEach(removeToken)
    LEGACY_REFRESH_TOKEN_KEYS.forEach(removeToken)
  },
}
