import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios"
import { env } from "../config/env"
import type { AuthTokens, RefreshTokenRequest } from "../types/auth"
import { unwrapApiData } from "./response"
import { tokenStore } from "./tokenStore"

type RetryableConfig = AxiosRequestConfig & { _retry?: boolean }

export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: env.requestTimeoutMs,
  headers: {
    "Content-Type": "application/json",
  },
})

const refreshClient = axios.create({
  baseURL: env.apiUrl,
  timeout: env.requestTimeoutMs,
  headers: {
    "Content-Type": "application/json",
  },
})

let isRefreshing = false
let refreshPromise: Promise<AuthTokens> | null = null

function withBearer(token: string): string {
  return `Bearer ${token}`
}

function unwrapAuthTokens(payload: any): AuthTokens {
  return unwrapApiData<AuthTokens>(payload)
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = tokenStore.getAccessToken()
  if (!accessToken) return config

  const headers = config.headers instanceof AxiosHeaders ? config.headers : new AxiosHeaders(config.headers)
  headers.set("Authorization", withBearer(accessToken))
  config.headers = headers
  return config
})

async function runRefreshFlow(): Promise<AuthTokens> {
  const refreshToken = tokenStore.getRefreshToken()
  if (!refreshToken) {
    throw new Error("Missing refresh token")
  }

  const payload: RefreshTokenRequest = { refreshToken }
  const { data } = await refreshClient.post<unknown>("/api/auth/refresh", payload)
  const tokens = unwrapAuthTokens(data)
  tokenStore.setTokens({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  })
  return tokens
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const status = error.response?.status
    const originalConfig = (error.config ?? {}) as RetryableConfig

    if (status !== 401 || originalConfig._retry) {
      throw error
    }

    const url = originalConfig.url ?? ""

    // Never run refresh flow for public auth endpoints.
    if (
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/register") ||
      url.includes("/api/auth/logout") ||
      url.includes("/api/auth/refresh")
    ) {
      tokenStore.clear()
      throw error
    }

    originalConfig._retry = true

    if (!isRefreshing) {
      isRefreshing = true
      refreshPromise = runRefreshFlow().finally(() => {
        isRefreshing = false
      })
    }

    try {
      await refreshPromise
      return api.request(originalConfig)
    } catch (refreshError) {
      tokenStore.clear()
      throw refreshError
    }
  },
)
