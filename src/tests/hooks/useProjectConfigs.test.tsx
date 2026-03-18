import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useCreateProjectConfig,
  useDeleteProjectConfig,
  useProjectConfig,
  useProjectConfigByGroup,
  useRestoreProjectConfig,
  useUpdateProjectConfig,
  useVerifyProjectConfig,
} from '../../hooks/useProjectConfigs'

const {
  getConfigMock,
  getConfigByGroupIdMock,
  createConfigMock,
  updateConfigMock,
  deleteConfigMock,
  verifyConfigMock,
  restoreConfigMock,
} = vi.hoisted(() => ({
  getConfigMock: vi.fn(),
  getConfigByGroupIdMock: vi.fn(),
  createConfigMock: vi.fn(),
  updateConfigMock: vi.fn(),
  deleteConfigMock: vi.fn(),
  verifyConfigMock: vi.fn(),
  restoreConfigMock: vi.fn(),
}))

vi.mock('../../api/projectConfigApi.ts', () => ({
  projectConfigApi: {
    getConfig: (id) => getConfigMock(id),
    getConfigByGroupId: (groupId) => getConfigByGroupIdMock(groupId),
    createConfig: (payload) => createConfigMock(payload),
    updateConfig: (id, payload) => updateConfigMock(id, payload),
    deleteConfig: (id) => deleteConfigMock(id),
    verifyConfig: (id) => verifyConfigMock(id),
    restoreConfig: (id) => restoreConfigMock(id),
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

describe('useProjectConfigs hooks', () => {
  beforeEach(() => {
    getConfigMock.mockReset()
    getConfigByGroupIdMock.mockReset()
    createConfigMock.mockReset()
    updateConfigMock.mockReset()
    deleteConfigMock.mockReset()
    verifyConfigMock.mockReset()
    restoreConfigMock.mockReset()
  })

  it('fetches project config by id', async () => {
    getConfigMock.mockResolvedValue({ id: 'cfg-1' })
    const { result } = renderHook(() => useProjectConfig('cfg-1'), { wrapper: wrapperFactory() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getConfigMock).toHaveBeenCalledWith('cfg-1')
  })

  it('does not fetch config by group when group id is invalid', async () => {
    const { result } = renderHook(() => useProjectConfigByGroup(0), { wrapper: wrapperFactory() })

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(getConfigByGroupIdMock).not.toHaveBeenCalled()
  })

  it('calls create/update/delete/verify/restore mutations', async () => {
    createConfigMock.mockResolvedValue({ groupId: 12 })
    updateConfigMock.mockResolvedValue({ id: 'cfg-1' })
    deleteConfigMock.mockResolvedValue({})
    verifyConfigMock.mockResolvedValue({})
    restoreConfigMock.mockResolvedValue({})

    const wrapper = wrapperFactory()

    const createHook = renderHook(() => useCreateProjectConfig(), { wrapper })
    const updateHook = renderHook(() => useUpdateProjectConfig(), { wrapper })
    const deleteHook = renderHook(() => useDeleteProjectConfig(), { wrapper })
    const verifyHook = renderHook(() => useVerifyProjectConfig(), { wrapper })
    const restoreHook = renderHook(() => useRestoreProjectConfig(), { wrapper })

    await createHook.result.current.mutateAsync({ groupId: 12 })
    await updateHook.result.current.mutateAsync({ id: 'cfg-1', payload: { jiraEmail: 'qa@edu.vn' } })
    await deleteHook.result.current.mutateAsync('cfg-1')
    await verifyHook.result.current.mutateAsync('cfg-1')
    await restoreHook.result.current.mutateAsync('cfg-1')

    expect(createConfigMock).toHaveBeenCalled()
    expect(updateConfigMock).toHaveBeenCalledWith('cfg-1', { jiraEmail: 'qa@edu.vn' })
    expect(deleteConfigMock).toHaveBeenCalledWith('cfg-1')
    expect(verifyConfigMock).toHaveBeenCalledWith('cfg-1')
    expect(restoreConfigMock).toHaveBeenCalledWith('cfg-1')
  })
})
