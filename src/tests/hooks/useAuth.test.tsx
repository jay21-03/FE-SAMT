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

  it('calls login mutation', async () => {
    loginMock.mockResolvedValue({ accessToken: 'a' })
    const { result } = renderHook(() => useLogin(), { wrapper: wrapperFactory() })

    await result.current.mutateAsync({ email: 'qa@example.com', password: 'x' })
    expect(loginMock).toHaveBeenCalledWith({ email: 'qa@example.com', password: 'x' })
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
})
