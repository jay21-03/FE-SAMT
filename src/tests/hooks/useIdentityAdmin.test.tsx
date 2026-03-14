import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useAuditByActor,
  useAuditByEntity,
  useAuditRange,
  useCreateAdminUser,
  useDeleteUser,
  useLockUser,
  useRestoreUser,
  useSecurityEvents,
  useUnlockUser,
  useUpdateExternalAccounts,
} from '../../hooks/useIdentityAdmin'

const {
  getSecurityEventsMock,
  getAuditByRangeMock,
  getAuditByEntityMock,
  getAuditByActorMock,
  createUserMock,
  deleteUserMock,
  restoreUserMock,
  lockUserMock,
  unlockUserMock,
  updateExternalAccountsMock,
} = vi.hoisted(() => ({
  getSecurityEventsMock: vi.fn(),
  getAuditByRangeMock: vi.fn(),
  getAuditByEntityMock: vi.fn(),
  getAuditByActorMock: vi.fn(),
  createUserMock: vi.fn(),
  deleteUserMock: vi.fn(),
  restoreUserMock: vi.fn(),
  lockUserMock: vi.fn(),
  unlockUserMock: vi.fn(),
  updateExternalAccountsMock: vi.fn(),
}))

vi.mock('../../api/identityAdminApi.ts', () => ({
  identityAdminApi: {
    getSecurityEvents: (query) => getSecurityEventsMock(query),
    getAuditByRange: (query) => getAuditByRangeMock(query),
    getAuditByEntity: (entityType, entityId, query) => getAuditByEntityMock(entityType, entityId, query),
    getAuditByActor: (actorId, query) => getAuditByActorMock(actorId, query),
    createUser: (payload) => createUserMock(payload),
    deleteUser: (userId) => deleteUserMock(userId),
    restoreUser: (userId) => restoreUserMock(userId),
    lockUser: (userId, reason) => lockUserMock(userId, reason),
    unlockUser: (userId) => unlockUserMock(userId),
    updateExternalAccounts: (userId, payload) => updateExternalAccountsMock(userId, payload),
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

describe('useIdentityAdmin hooks', () => {
  beforeEach(() => {
    getSecurityEventsMock.mockReset()
    getAuditByRangeMock.mockReset()
    getAuditByEntityMock.mockReset()
    getAuditByActorMock.mockReset()
    createUserMock.mockReset()
    deleteUserMock.mockReset()
    restoreUserMock.mockReset()
    lockUserMock.mockReset()
    unlockUserMock.mockReset()
    updateExternalAccountsMock.mockReset()
  })

  it('fetches security and audit queries', async () => {
    getSecurityEventsMock.mockResolvedValue({ content: [] })
    getAuditByRangeMock.mockResolvedValue({ content: [] })
    getAuditByEntityMock.mockResolvedValue({ content: [] })
    getAuditByActorMock.mockResolvedValue({ content: [] })

    const wrapper = wrapperFactory()

    const securityHook = renderHook(() => useSecurityEvents({ page: 0, size: 10 }), { wrapper })
    const rangeHook = renderHook(() => useAuditRange({ page: 0, size: 10 }, true), { wrapper })
    const entityHook = renderHook(() => useAuditByEntity('USER', 10, { page: 0, size: 10 }), { wrapper })
    const actorHook = renderHook(() => useAuditByActor(1, { page: 0, size: 10 }), { wrapper })

    await waitFor(() => {
      expect(securityHook.result.current.isSuccess).toBe(true)
      expect(rangeHook.result.current.isSuccess).toBe(true)
      expect(entityHook.result.current.isSuccess).toBe(true)
      expect(actorHook.result.current.isSuccess).toBe(true)
    })
  })

  it('uses enabled guards for invalid entity and actor ids', async () => {
    const wrapper = wrapperFactory()

    const entityHook = renderHook(() => useAuditByEntity('', 0, { page: 0, size: 10 }), { wrapper })
    const actorHook = renderHook(() => useAuditByActor(0, { page: 0, size: 10 }), { wrapper })

    await waitFor(() => {
      expect(entityHook.result.current.fetchStatus).toBe('idle')
      expect(actorHook.result.current.fetchStatus).toBe('idle')
    })
    expect(getAuditByEntityMock).not.toHaveBeenCalled()
    expect(getAuditByActorMock).not.toHaveBeenCalled()
  })

  it('calls admin mutation hooks', async () => {
    createUserMock.mockResolvedValue({ id: 1 })
    deleteUserMock.mockResolvedValue({})
    restoreUserMock.mockResolvedValue({})
    lockUserMock.mockResolvedValue({})
    unlockUserMock.mockResolvedValue({})
    updateExternalAccountsMock.mockResolvedValue({})

    const wrapper = wrapperFactory()

    const createHook = renderHook(() => useCreateAdminUser(), { wrapper })
    const deleteHook = renderHook(() => useDeleteUser(), { wrapper })
    const restoreHook = renderHook(() => useRestoreUser(), { wrapper })
    const lockHook = renderHook(() => useLockUser(), { wrapper })
    const unlockHook = renderHook(() => useUnlockUser(), { wrapper })
    const externalHook = renderHook(() => useUpdateExternalAccounts(), { wrapper })

    await createHook.result.current.mutateAsync({ email: 'admin@qa.com' })
    await deleteHook.result.current.mutateAsync(5)
    await restoreHook.result.current.mutateAsync(5)
    await lockHook.result.current.mutateAsync({ userId: 5, reason: 'policy' })
    await unlockHook.result.current.mutateAsync(5)
    await externalHook.result.current.mutateAsync({ userId: 5, payload: { jiraAccountId: 'jira-1' } })

    expect(createUserMock).toHaveBeenCalled()
    expect(deleteUserMock).toHaveBeenCalledWith(5)
    expect(restoreUserMock).toHaveBeenCalledWith(5)
    expect(lockUserMock).toHaveBeenCalledWith(5, 'policy')
    expect(unlockUserMock).toHaveBeenCalledWith(5)
    expect(updateExternalAccountsMock).toHaveBeenCalledWith(5, { jiraAccountId: 'jira-1' })
  })
})
