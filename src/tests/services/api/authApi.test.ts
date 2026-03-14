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
