import { describe, it, expect, beforeEach } from 'vitest'
import { tokenStore } from '../../../api/tokenStore'

describe('tokenStore', () => {
  beforeEach(() => {
    localStorage.clear()
    tokenStore.clear()
  })

  it('persists and reads access/refresh tokens', () => {
    tokenStore.setTokens({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    })

    expect(localStorage.getItem('access_token')).toBe('access-1')
    expect(localStorage.getItem('refresh_token')).toBe('refresh-1')
    expect(tokenStore.getAccessToken()).toBe('access-1')
    expect(tokenStore.getRefreshToken()).toBe('refresh-1')
  })

  it('clears tokens from memory and localStorage', () => {
    tokenStore.setTokens({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
    })

    tokenStore.clear()

    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(tokenStore.getAccessToken()).toBeNull()
    expect(tokenStore.getRefreshToken()).toBeNull()
  })
})
