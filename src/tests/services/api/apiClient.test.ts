import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createMock,
  apiRequestMock,
  refreshPostMock,
  interceptorCallbacks,
} = vi.hoisted(() => {
  const apiRequestMock = vi.fn()
  const refreshPostMock = vi.fn()
  const interceptorCallbacks: {
    request?: (config: any) => any
    responseError?: (error: any) => any
  } = {}

  const createMock = vi.fn(() => ({
    interceptors: {
      request: {
        use: vi.fn((onFulfilled: (config: any) => any) => {
          interceptorCallbacks.request = onFulfilled
        }),
      },
      response: {
        use: vi.fn((_: unknown, onRejected: (error: any) => any) => {
          interceptorCallbacks.responseError = onRejected
        }),
      },
    },
    request: apiRequestMock,
    post: refreshPostMock,
  }))

  return {
    createMock,
    apiRequestMock,
    refreshPostMock,
    interceptorCallbacks,
  }
})

vi.mock('axios', () => {
  class MockAxiosHeaders {
    private readonly values = new Map<string, string>()

    constructor(initialHeaders?: Record<string, string>) {
      if (!initialHeaders) return
      for (const [key, value] of Object.entries(initialHeaders)) {
        this.values.set(key.toLowerCase(), value)
      }
    }

    set(key: string, value: string) {
      this.values.set(key.toLowerCase(), value)
    }

    get(key: string) {
      return this.values.get(key.toLowerCase())
    }
  }

  return {
    default: {
      create: createMock,
    },
    create: createMock,
    AxiosHeaders: MockAxiosHeaders,
  }
})

import '../../../api/apiClient.ts'
import { tokenStore } from '../../../api/tokenStore'

describe('apiClient interceptors', () => {
  beforeEach(() => {
    tokenStore.clear()
    apiRequestMock.mockReset()
    refreshPostMock.mockReset()
  })

  it('adds bearer token to request headers when access token exists', async () => {
    tokenStore.setTokens({ accessToken: 'access-123', refreshToken: 'refresh-123' })

    const requestInterceptor = interceptorCallbacks.request
    expect(requestInterceptor).toBeTypeOf('function')
    if (!requestInterceptor) throw new Error('request interceptor missing')
    const config = await requestInterceptor({ headers: {} })

    expect(config.headers.get('Authorization')).toBe('Bearer access-123')
  })

  it('does not add bearer token for public auth endpoints', async () => {
    tokenStore.setTokens({ accessToken: 'stale-access', refreshToken: 'stale-refresh' })

    const requestInterceptor = interceptorCallbacks.request
    expect(requestInterceptor).toBeTypeOf('function')
    if (!requestInterceptor) throw new Error('request interceptor missing')

    const config = await requestInterceptor({ url: '/api/auth/login', headers: {} })
    const authorization =
      typeof config.headers?.get === 'function'
        ? config.headers.get('Authorization')
        : config.headers?.Authorization

    expect(authorization).toBeUndefined()
  })

  it('refreshes token and retries request for non-auth 401 responses', async () => {
    tokenStore.setTokens({ accessToken: 'expired-token', refreshToken: 'refresh-token' })

    refreshPostMock.mockResolvedValue({
      data: {
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      },
    })
    apiRequestMock.mockResolvedValue({ data: { ok: true } })

    const responseErrorInterceptor = interceptorCallbacks.responseError
    expect(responseErrorInterceptor).toBeTypeOf('function')
    if (!responseErrorInterceptor) throw new Error('response error interceptor missing')
    const result = await responseErrorInterceptor({
      response: { status: 401 },
      config: { url: '/api/users/me', headers: {} },
    })

    expect(refreshPostMock).toHaveBeenCalledWith('/api/auth/refresh', {
      refreshToken: 'refresh-token',
    })
    expect(apiRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/api/users/me', _retry: true }),
    )
    expect(tokenStore.getAccessToken()).toBe('new-access-token')
    expect(tokenStore.getRefreshToken()).toBe('new-refresh-token')
    expect(result).toEqual({ data: { ok: true } })
  })

  it('clears tokens and rethrows for auth endpoints returning 401', async () => {
    tokenStore.setTokens({ accessToken: 'expired-token', refreshToken: 'refresh-token' })

    const responseErrorInterceptor = interceptorCallbacks.responseError
    expect(responseErrorInterceptor).toBeTypeOf('function')
    if (!responseErrorInterceptor) throw new Error('response error interceptor missing')
    const authError = {
      response: { status: 401 },
      config: { url: '/api/auth/login', headers: {} },
    }

    await expect(responseErrorInterceptor(authError)).rejects.toBe(authError)
    expect(tokenStore.getAccessToken()).toBeNull()
    expect(tokenStore.getRefreshToken()).toBeNull()
    expect(refreshPostMock).not.toHaveBeenCalled()
  })

  it('clears tokens when refresh fails for protected endpoint', async () => {
    tokenStore.setTokens({ accessToken: 'expired-token', refreshToken: 'refresh-token' })
    const refreshError = new Error('refresh failed')
    refreshPostMock.mockRejectedValue(refreshError)

    const responseErrorInterceptor = interceptorCallbacks.responseError
    expect(responseErrorInterceptor).toBeTypeOf('function')
    if (!responseErrorInterceptor) throw new Error('response error interceptor missing')

    await expect(
      responseErrorInterceptor({
        response: { status: 401 },
        config: { url: '/api/users/me', headers: {} },
      }),
    ).rejects.toBe(refreshError)

    expect(refreshPostMock).toHaveBeenCalledTimes(1)
    expect(apiRequestMock).not.toHaveBeenCalled()
    expect(tokenStore.getAccessToken()).toBeNull()
    expect(tokenStore.getRefreshToken()).toBeNull()
  })

  it('uses a single refresh flow for concurrent 401 requests', async () => {
    tokenStore.setTokens({ accessToken: 'expired-token', refreshToken: 'refresh-token' })

    let resolveRefresh: (value: unknown) => void = () => undefined
    refreshPostMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve
        }),
    )
    apiRequestMock.mockResolvedValue({ data: { ok: true } })

    const responseErrorInterceptor = interceptorCallbacks.responseError
    expect(responseErrorInterceptor).toBeTypeOf('function')
    if (!responseErrorInterceptor) throw new Error('response error interceptor missing')

    const firstRetryPromise = responseErrorInterceptor({
      response: { status: 401 },
      config: { url: '/api/reports/1', headers: {} },
    })
    const secondRetryPromise = responseErrorInterceptor({
      response: { status: 401 },
      config: { url: '/api/reports/2', headers: {} },
    })

    expect(refreshPostMock).toHaveBeenCalledTimes(1)

    resolveRefresh({
      data: {
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      },
    })

    await Promise.all([firstRetryPromise, secondRetryPromise])

    expect(apiRequestMock).toHaveBeenCalledTimes(2)
    expect(tokenStore.getAccessToken()).toBe('new-access-token')
    expect(tokenStore.getRefreshToken()).toBe('new-refresh-token')
  })
})
