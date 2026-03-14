import { beforeEach, describe, expect, it, vi } from 'vitest'
import { syncApi } from '../../../api/syncApi'

const { getMock, postMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}))

vi.mock('../../../api/apiClient.ts', () => ({
  api: {
    get: getMock,
    post: postMock,
  },
}))

describe('syncApi', () => {
  beforeEach(() => {
    getMock.mockReset()
    postMock.mockReset()
  })

  it('syncJiraIssues posts expected endpoint and payload', async () => {
    const expected = {
      syncJobId: 11,
      projectConfigId: 'cfg-1',
      jobType: 'JIRA_ISSUES',
      success: true,
      degraded: false,
      recordsFetched: 100,
      recordsSaved: 90,
      durationMs: 1200,
    }
    postMock.mockResolvedValue({ data: { data: expected } })

    const result = await syncApi.syncJiraIssues('cfg-1')

    expect(postMock).toHaveBeenCalledWith('/api/sync/jira/issues', { projectConfigId: 'cfg-1' })
    expect(result).toEqual(expected)
  })

  it('syncGithubCommits posts expected endpoint and payload', async () => {
    const expected = {
      syncJobId: 22,
      projectConfigId: 'cfg-2',
      jobType: 'GITHUB_COMMITS',
      success: true,
      degraded: false,
      recordsFetched: 50,
      recordsSaved: 50,
      durationMs: 800,
    }
    postMock.mockResolvedValue({ data: { data: expected } })

    const result = await syncApi.syncGithubCommits('cfg-2')

    expect(postMock).toHaveBeenCalledWith('/api/sync/github/commits', { projectConfigId: 'cfg-2' })
    expect(result).toEqual(expected)
  })

  it('syncAll returns nested aggregate result', async () => {
    const expected = {
      projectConfigId: 'cfg-3',
      success: true,
      degraded: false,
      durationMs: 2100,
      jira: {
        syncJobId: 101,
        projectConfigId: 'cfg-3',
        jobType: 'JIRA_ISSUES',
        success: true,
        degraded: false,
        recordsFetched: 40,
        recordsSaved: 40,
        durationMs: 1000,
      },
      github: {
        syncJobId: 102,
        projectConfigId: 'cfg-3',
        jobType: 'GITHUB_COMMITS',
        success: true,
        degraded: false,
        recordsFetched: 70,
        recordsSaved: 70,
        durationMs: 1100,
      },
    }
    postMock.mockResolvedValue({ data: { data: expected } })

    const result = await syncApi.syncAll('cfg-3')

    expect(postMock).toHaveBeenCalledWith('/api/sync/all', { projectConfigId: 'cfg-3' })
    expect(result).toEqual(expected)
  })

  it('getSyncJob calls id endpoint and unwraps response envelope', async () => {
    const expected = {
      syncJobId: 7,
      projectConfigId: 'cfg-4',
      jobType: 'JIRA_ISSUES',
      status: 'COMPLETED',
      degraded: false,
    }
    getMock.mockResolvedValue({ data: { data: expected } })

    const result = await syncApi.getSyncJob(7)

    expect(getMock).toHaveBeenCalledWith('/api/sync/jobs/7')
    expect(result).toEqual(expected)
  })

  it('listSyncJobs forwards query params when provided', async () => {
    const query = { status: 'FAILED', page: 2, size: 5 }
    const expected = {
      content: [],
      page: 2,
      size: 5,
      totalElements: 0,
      totalPages: 0,
    }
    getMock.mockResolvedValue({ data: { data: expected } })

    const result = await syncApi.listSyncJobs(query)

    expect(getMock).toHaveBeenCalledWith('/api/sync/jobs', { params: query })
    expect(result).toEqual(expected)
  })

  it('listSyncJobs sends undefined params when query omitted', async () => {
    const expected = {
      content: [],
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0,
    }
    getMock.mockResolvedValue({ data: { data: expected } })

    const result = await syncApi.listSyncJobs()

    expect(getMock).toHaveBeenCalledWith('/api/sync/jobs', { params: undefined })
    expect(result).toEqual(expected)
  })
})
