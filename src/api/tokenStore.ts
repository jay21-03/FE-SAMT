export interface TokenPair {
  accessToken: string
  refreshToken: string
}

const ACCESS_TOKEN_KEY = "access_token"
const REFRESH_TOKEN_KEY = "refresh_token"

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

export const tokenStore = {
  getAccessToken(): string | null {
    return readToken(ACCESS_TOKEN_KEY) ?? memoryTokens?.accessToken ?? null
  },
  getRefreshToken(): string | null {
    return readToken(REFRESH_TOKEN_KEY) ?? memoryTokens?.refreshToken ?? null
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
  },
}
