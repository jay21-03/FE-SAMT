import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLogin, useLogout, useProfile, useRegister, useUpdateProfile } from '../../hooks/useAuth'

const {
  loginMock,
  registerMock,
  logoutMock,
  getProfileMock,
  updateProfileMock,
} = vi.hoisted(() => ({
  loginMock: vi.fn(),
  registerMock: vi.fn(),
  logoutMock: vi.fn(),
  getProfileMock: vi.fn(),
  updateProfileMock: vi.fn(),
}))

vi.mock('../../api/authApi.ts', () => ({
  authApi: {
    login: (payload) => loginMock(payload),
    register: (payload) => registerMock(payload),
    logout: () => logoutMock(),
    getProfile: () => getProfileMock(),
    updateProfile: (payload) => updateProfileMock(payload),
  },
}))

function wrapperFactory() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useAuth hooks', () => {
  beforeEach(() => {
    loginMock.mockReset()
    registerMock.mockReset()
    logoutMock.mockReset()
    getProfileMock.mockReset()
    updateProfileMock.mockReset()
  })

  it('fetches profile via useProfile', async () => {
    getProfileMock.mockResolvedValue({ id: 1, fullName: 'QA' })

    const { result } = renderHook(() => useProfile(), { wrapper: wrapperFactory() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ id: 1, fullName: 'QA' })
  })

  it('exposes profile query error state', async () => {
    getProfileMock.mockRejectedValue(new Error('profile failed'))

    const { result } = renderHook(() => useProfile(), { wrapper: wrapperFactory() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('calls login mutation', async () => {
    loginMock.mockResolvedValue({ accessToken: 'a' })
    const { result } = renderHook(() => useLogin(), { wrapper: wrapperFactory() })

    await result.current.mutateAsync({ email: 'qa@example.com', password: 'x' })
    expect(loginMock).toHaveBeenCalledWith({ email: 'qa@example.com', password: 'x' })
  })

  it('propagates login mutation errors', async () => {
    loginMock.mockRejectedValue(new Error('login failed'))
    const { result } = renderHook(() => useLogin(), { wrapper: wrapperFactory() })

    await expect(result.current.mutateAsync({ email: 'qa@example.com', password: 'bad' })).rejects.toThrow(
      'login failed',
    )
  })

  it('calls register mutation', async () => {
    registerMock.mockResolvedValue({ id: 10 })
    const { result } = renderHook(() => useRegister(), { wrapper: wrapperFactory() })

    await result.current.mutateAsync({ email: 'qa@example.com', password: 'x', fullName: 'QA' })
    expect(registerMock).toHaveBeenCalled()
  })

  it('calls logout mutation', async () => {
    logoutMock.mockResolvedValue({})
    const { result } = renderHook(() => useLogout(), { wrapper: wrapperFactory() })

    await result.current.mutateAsync()
    expect(logoutMock).toHaveBeenCalled()
  })

  it('calls update profile mutation', async () => {
    updateProfileMock.mockResolvedValue({ id: 1 })
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: wrapperFactory() })

    await result.current.mutateAsync({ fullName: 'New QA', email: 'new@qa.com' })
    expect(updateProfileMock).toHaveBeenCalledWith({ fullName: 'New QA', email: 'new@qa.com' })
  })

  it('invalidates auth session query after update profile success', async () => {
    updateProfileMock.mockResolvedValue({ id: 1, fullName: 'Updated' })
    getProfileMock.mockResolvedValue({ id: 1, fullName: 'Original' })
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: wrapperFactory() })

    await result.current.mutateAsync({ fullName: 'Updated', email: 'updated@samt.local' })

    expect(updateProfileMock).toHaveBeenCalledWith({ fullName: 'Updated', email: 'updated@samt.local' })
  })

  it('propagates update profile mutation errors', async () => {
    updateProfileMock.mockRejectedValue(new Error('update failed'))
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: wrapperFactory() })

    await expect(
      result.current.mutateAsync({ fullName: 'Broken', email: 'broken@samt.local' }),
    ).rejects.toThrow('update failed')
  })
})
