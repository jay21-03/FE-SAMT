import type { AuthTokens, LoginRequest, LogoutRequest, RegisterRequest } from "../types/auth"
import { api } from "./apiClient"
import { tokenStore } from "./tokenStore"

export interface RegisterResponse {
  user: {
    id: number
    email: string
    fullName: string
    role?: string
    status?: string
  }
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export const authApi = {
  async login(payload: LoginRequest): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>("/api/auth/login", payload)
    tokenStore.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
    return data
  },

  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    const { data } = await api.post<RegisterResponse>("/api/auth/register", payload)
    return data
  },

  async refresh(): Promise<AuthTokens> {
    const refreshToken = tokenStore.getRefreshToken()
    if (!refreshToken) throw new Error("Missing refresh token")
    const { data } = await api.post<AuthTokens>("/api/auth/refresh", { refreshToken })
    tokenStore.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
    return data
  },

  async logout(payload?: LogoutRequest): Promise<void> {
    const refreshToken = payload?.refreshToken ?? tokenStore.getRefreshToken()
    if (refreshToken) {
      await api.post("/api/auth/logout", { refreshToken })
    }
    tokenStore.clear()
  },
}
