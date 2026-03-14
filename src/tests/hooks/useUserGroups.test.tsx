import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { useGroupMembers, useGroups } from '../../hooks/useUserGroups'

const { listGroupsMock, getGroupMembersMock } = vi.hoisted(() => ({
  listGroupsMock: vi.fn(),
  getGroupMembersMock: vi.fn(),
}))

vi.mock('../../api/userGroupApi.ts', () => ({
  userGroupApi: {
    listGroups: listGroupsMock,
    getGroupMembers: getGroupMembersMock,
  },
}))

function wrapperFactory() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useUserGroups hooks', () => {
  beforeEach(() => {
    listGroupsMock.mockReset()
    getGroupMembersMock.mockReset()
  })

  it('fetches groups when enabled', async () => {
    listGroupsMock.mockResolvedValue({ content: [{ id: 1, groupName: 'SE1704' }] })

    const { result } = renderHook(() => useGroups({ page: 0, size: 20 }, { enabled: true }), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.content).toEqual([{ id: 1, groupName: 'SE1704' }])
    expect(listGroupsMock).toHaveBeenCalledTimes(1)
  })

  it('does not fetch group members for invalid group id', async () => {
    const { result } = renderHook(() => useGroupMembers(0), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(getGroupMembersMock).not.toHaveBeenCalled()
  })
})
