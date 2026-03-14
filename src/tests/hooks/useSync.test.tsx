import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSyncAll, useSyncGithub, useSyncJira, useSyncJob, useSyncJobs } from '../../hooks/useSync'

const {
  syncJiraIssuesMock,
  syncGithubCommitsMock,
  syncAllMock,
  getSyncJobMock,
  listSyncJobsMock,
} = vi.hoisted(() => ({
  syncJiraIssuesMock: vi.fn(),
  syncGithubCommitsMock: vi.fn(),
  syncAllMock: vi.fn(),
  getSyncJobMock: vi.fn(),
  listSyncJobsMock: vi.fn(),
}))

vi.mock('../../api/syncApi.ts', () => ({
  syncApi: {
    syncJiraIssues: (projectConfigId) => syncJiraIssuesMock(projectConfigId),
    syncGithubCommits: (projectConfigId) => syncGithubCommitsMock(projectConfigId),
    syncAll: (projectConfigId) => syncAllMock(projectConfigId),
    getSyncJob: (jobId) => getSyncJobMock(jobId),
    listSyncJobs: (query) => listSyncJobsMock(query),
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

describe('useSync hooks', () => {
  beforeEach(() => {
    syncJiraIssuesMock.mockReset()
    syncGithubCommitsMock.mockReset()
    syncAllMock.mockReset()
    getSyncJobMock.mockReset()
    listSyncJobsMock.mockReset()
  })

  it('runs sync mutations for jira/github/all', async () => {
    syncJiraIssuesMock.mockResolvedValue({ id: 1 })
    syncGithubCommitsMock.mockResolvedValue({ id: 2 })
    syncAllMock.mockResolvedValue({ id: 3 })

    const wrapper = wrapperFactory()
    const jiraHook = renderHook(() => useSyncJira(), { wrapper })
    const githubHook = renderHook(() => useSyncGithub(), { wrapper })
    const allHook = renderHook(() => useSyncAll(), { wrapper })

    await jiraHook.result.current.mutateAsync('cfg-1')
    await githubHook.result.current.mutateAsync('cfg-1')
    await allHook.result.current.mutateAsync('cfg-1')

    expect(syncJiraIssuesMock).toHaveBeenCalledWith('cfg-1')
    expect(syncGithubCommitsMock).toHaveBeenCalledWith('cfg-1')
    expect(syncAllMock).toHaveBeenCalledWith('cfg-1')
  })

  it('uses enabled guard for sync job query', async () => {
    const { result } = renderHook(() => useSyncJob(0), { wrapper: wrapperFactory() })

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(getSyncJobMock).not.toHaveBeenCalled()
  })

  it('fetches sync jobs list', async () => {
    listSyncJobsMock.mockResolvedValue({ content: [{ id: 10 }] })

    const { result } = renderHook(() => useSyncJobs({ page: 0, size: 10 }), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listSyncJobsMock).toHaveBeenCalledWith({ page: 0, size: 10 })
  })
})
