import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '../../../api/authApi'
import { tokenStore } from '../../../api/tokenStore'

const { getMock, postMock, putMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  putMock: vi.fn(),
}))

vi.mock('../../../api/apiClient.ts', () => ({
  api: {
    get: getMock,
    post: postMock,
    put: putMock,
  },
}))

describe('authApi', () => {
  beforeEach(() => {
    tokenStore.clear()
    getMock.mockReset()
    postMock.mockReset()
    putMock.mockReset()
  })

  it('stores tokens after successful login', async () => {
    postMock.mockResolvedValue({
      data: {
        data: {
          accessToken: 'access-1',
          refreshToken: 'refresh-1',
          tokenType: 'Bearer',
          expiresIn: 3600,
        },
      },
    })

    const tokens = await authApi.login({ email: 'qa@example.com', password: 'password' })

    expect(postMock).toHaveBeenCalledWith('/api/auth/login', {
      email: 'qa@example.com',
      password: 'password',
    })
    expect(tokens.accessToken).toBe('access-1')
    expect(tokenStore.getAccessToken()).toBe('access-1')
    expect(tokenStore.getRefreshToken()).toBe('refresh-1')
  })

  it('supports flat login payload shape without nested data envelope', async () => {
    postMock.mockResolvedValue({
      data: {
        accessToken: 'flat-access',
        refreshToken: 'flat-refresh',
        tokenType: 'Bearer',
        expiresIn: 3600,
      },
    })

    const tokens = await authApi.login({ email: 'flat@example.com', password: 'password' })

    expect(tokens.accessToken).toBe('flat-access')
    expect(tokenStore.getAccessToken()).toBe('flat-access')
    expect(tokenStore.getRefreshToken()).toBe('flat-refresh')
  })

  it('unwraps register response body from ApiResponse envelope', async () => {
    postMock.mockResolvedValue({
      data: {
        data: {
          user: { id: 11, email: 'new@samt.local', fullName: 'New User' },
          accessToken: 'register-access',
          refreshToken: 'register-refresh',
          tokenType: 'Bearer',
          expiresIn: 900,
        },
      },
    })

    const response = await authApi.register({
      email: 'new@samt.local',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      fullName: 'New User',
      role: 'STUDENT',
    })

    expect(postMock).toHaveBeenCalledWith('/api/auth/register', {
      email: 'new@samt.local',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      fullName: 'New User',
      role: 'STUDENT',
    })
    expect(response.user.id).toBe(11)
    expect(response.accessToken).toBe('register-access')
  })

  it('throws when refresh token is missing', async () => {
    await expect(authApi.refresh()).rejects.toThrow('Missing refresh token')
    expect(postMock).not.toHaveBeenCalled()
  })

  it('clears local tokens even when logout API request fails', async () => {
    tokenStore.setTokens({ accessToken: 'access-old', refreshToken: 'refresh-old' })
    postMock.mockRejectedValue(new Error('network down'))

    await expect(authApi.logout()).rejects.toThrow('network down')

    expect(postMock).toHaveBeenCalledWith('/api/auth/logout', { refreshToken: 'refresh-old' })
    expect(tokenStore.getAccessToken()).toBeNull()
    expect(tokenStore.getRefreshToken()).toBeNull()
  })

  it('refreshes and stores new tokens', async () => {
    tokenStore.setTokens({ accessToken: 'old-access', refreshToken: 'old-refresh' })
    postMock.mockResolvedValue({
      data: {
        data: {
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
          tokenType: 'Bearer',
          expiresIn: 900,
        },
      },
    })

    const tokens = await authApi.refresh()

    expect(postMock).toHaveBeenCalledWith('/api/auth/refresh', { refreshToken: 'old-refresh' })
    expect(tokens.accessToken).toBe('new-access')
    expect(tokenStore.getAccessToken()).toBe('new-access')
    expect(tokenStore.getRefreshToken()).toBe('new-refresh')
  })

  it('uses explicit refresh token in logout payload when provided', async () => {
    tokenStore.setTokens({ accessToken: 'token-a', refreshToken: 'token-b' })
    postMock.mockResolvedValue({ data: {} })

    await authApi.logout({ refreshToken: 'override-token' })

    expect(postMock).toHaveBeenCalledWith('/api/auth/logout', { refreshToken: 'override-token' })
    expect(tokenStore.getAccessToken()).toBeNull()
    expect(tokenStore.getRefreshToken()).toBeNull()
  })

  it('clears tokens without remote call when no refresh token exists', async () => {
    tokenStore.clear()

    await authApi.logout()

    expect(postMock).not.toHaveBeenCalled()
    expect(tokenStore.getAccessToken()).toBeNull()
    expect(tokenStore.getRefreshToken()).toBeNull()
  })

  it('returns profile data envelope and updates profile', async () => {
    getMock.mockResolvedValue({ data: { data: { id: 1, email: 'qa@example.com' } } })
    putMock.mockResolvedValue({ data: { data: { id: 1, fullName: 'QA User' } } })

    const profile = await authApi.getProfile()
    const updated = await authApi.updateProfile({ email: 'qa@example.com', fullName: 'QA User' })

    expect(profile).toEqual({ id: 1, email: 'qa@example.com' })
    expect(updated).toEqual({ id: 1, fullName: 'QA User' })
    expect(getMock).toHaveBeenCalledWith('/api/users/me')
    expect(putMock).toHaveBeenCalledWith('/api/users/me', { email: 'qa@example.com', fullName: 'QA User' })
  })
})
