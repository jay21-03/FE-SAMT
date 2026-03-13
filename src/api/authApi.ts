import type { AuthTokens, LoginRequest, LogoutRequest, RegisterRequest } from "../types/auth"
import type { IdentityUser, ProfileEnvelope, UpdateProfileRequest } from "../types/identity"
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

function unwrapAuthTokens(payload: any): AuthTokens {
  const authData = payload && payload.data ? payload.data : payload
  return authData as AuthTokens
}

export const authApi = {
  async login(payload: LoginRequest): Promise<AuthTokens> {
    const { data } = await api.post<unknown>("/api/auth/login", payload)
    const tokens = unwrapAuthTokens(data)
    tokenStore.setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
    return tokens
  },

  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    const { data } = await api.post<RegisterResponse>("/api/auth/register", payload)
    return data
  },

  async refresh(): Promise<AuthTokens> {
    const refreshToken = tokenStore.getRefreshToken()
    if (!refreshToken) throw new Error("Missing refresh token")
    const { data } = await api.post<unknown>("/api/auth/refresh", { refreshToken })
    const tokens = unwrapAuthTokens(data)
    tokenStore.setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
    return tokens
  },

  async logout(payload?: LogoutRequest): Promise<void> {
    const refreshToken = payload?.refreshToken ?? tokenStore.getRefreshToken()
    if (refreshToken) {
      await api.post("/api/auth/logout", { refreshToken })
    }
    tokenStore.clear()
  },

  async getProfile(): Promise<IdentityUser> {
    const { data } = await api.get<ProfileEnvelope>("/api/users/me")
    return data.data
  },

  async updateProfile(payload: UpdateProfileRequest): Promise<IdentityUser> {
    const { data } = await api.put<ProfileEnvelope>("/api/users/me", payload)
    return data.data
  },
}
