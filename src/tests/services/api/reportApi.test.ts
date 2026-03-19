import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reportApi } from '../../../api/reportApi'

const { getMock, postMock, patchMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  patchMock: vi.fn(),
}))

vi.mock('../../../api/apiClient.ts', () => ({
  api: {
    get: getMock,
    post: postMock,
    patch: patchMock,
  },
}))

describe('reportApi', () => {
  beforeEach(() => {
    getMock.mockReset()
    postMock.mockReset()
    patchMock.mockReset()
  })

  it('generates report and fetches metadata/list', async () => {
    postMock.mockResolvedValue({ data: { data: { reportId: 'r-1' } } })
    getMock
      .mockResolvedValueOnce({ data: { data: { reportId: 'r-1', type: 'SRS' } } })
      .mockResolvedValueOnce({ data: { data: { content: [{ reportId: 'r-1' }], totalElements: 1 } } })

    const generated = await reportApi.generateSrsReport({ projectConfigId: '1', useAi: true, exportType: 'DOCX' })
    const metadata = await reportApi.getReport('r-1')
    const list = await reportApi.listReports({ page: 0, size: 10 })

    expect(postMock).toHaveBeenCalledWith(
      '/api/reports/srs',
      { projectConfigId: '1', useAi: true, exportType: 'DOCX' },
      { timeout: 10 * 60 * 1000 },
    )
    expect(getMock).toHaveBeenCalledWith('/api/reports/r-1')
    expect(getMock).toHaveBeenCalledWith('/api/reports', { params: { page: 0, size: 10 } })
    expect(generated).toEqual({ reportId: 'r-1' })
    expect(metadata).toEqual({ reportId: 'r-1', type: 'SRS' })
    expect(list).toEqual({ content: [{ reportId: 'r-1' }], totalElements: 1 })
  })

  it('generates work distribution and commit analysis reports', async () => {
    postMock
      .mockResolvedValueOnce({ data: { data: { reportId: 'wd-1' } } })
      .mockResolvedValueOnce({ data: { data: { reportId: 'ca-1' } } })

    const payload = {
      projectConfigId: '1010',
      groupId: '10',
      timeRange: { from: '2026-03-01', to: '2026-03-10' },
      members: [{ id: '1', name: 'Student One' }],
      jiraIssues: [],
      gitCommits: [],
    }

    const wd = await reportApi.generateWorkDistributionReport(payload)
    const ca = await reportApi.generateCommitAnalysisReport(payload)

    expect(postMock).toHaveBeenCalledWith(
      '/api/reports/work-distribution',
      payload,
      { timeout: 10 * 60 * 1000 },
    )
    expect(postMock).toHaveBeenCalledWith(
      '/api/reports/commit-analysis',
      payload,
      { timeout: 10 * 60 * 1000 },
    )
    expect(wd).toEqual({ reportId: 'wd-1' })
    expect(ca).toEqual({ reportId: 'ca-1' })
  })

  it('downloads report and parses file name from content-disposition', async () => {
    if (typeof window.URL.createObjectURL !== 'function') {
      Object.defineProperty(window.URL, 'createObjectURL', {
        value: vi.fn(),
        configurable: true,
      })
    }
    const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:test-url')

    getMock.mockResolvedValue({
      data: new Uint8Array([1, 2, 3]),
      headers: { 'content-disposition': "attachment; filename*=UTF-8''SRS%20Report.docx" },
    })

    const result = await reportApi.downloadReport('r-2')

    expect(getMock).toHaveBeenCalledWith('/api/reports/r-2/download', { responseType: 'blob' })
    expect(result).toEqual({ url: 'blob:test-url', fileName: 'SRS Report.docx' })

    createObjectURLSpy.mockRestore()
  })

  it('uses default file name when content-disposition header is missing', async () => {
    if (typeof window.URL.createObjectURL !== 'function') {
      Object.defineProperty(window.URL, 'createObjectURL', {
        value: vi.fn(),
        configurable: true,
      })
    }
    const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:fallback-url')

    getMock.mockResolvedValue({
      data: new Uint8Array([4, 5, 6]),
      headers: {},
    })

    const result = await reportApi.downloadReport('r-9', 'srs_r-9.pdf')

    expect(getMock).toHaveBeenCalledWith('/api/reports/r-9/download', { responseType: 'blob' })
    expect(result).toEqual({ url: 'blob:fallback-url', fileName: 'srs_r-9.pdf' })

    createObjectURLSpy.mockRestore()
  })

  it('fetches student and lecturer report-related endpoints', async () => {
    getMock.mockResolvedValue({ data: { data: { content: [] } } })

    await reportApi.getStudentTasks({ page: 0, size: 10 })
    await reportApi.getStudentGithubStats({ groupId: 12 })
    await reportApi.getStudentContributionSummary({ groupId: 12 })
    await reportApi.getLecturerOverview({ from: '2026-01-01' })
    await reportApi.getGroupProgress(10, { to: '2026-03-01' })
    await reportApi.getRecentActivities(10, { page: 0, size: 5 })

    expect(getMock).toHaveBeenCalledWith('/api/reports/students/me/tasks', { params: { page: 0, size: 10 } })
    expect(getMock).toHaveBeenCalledWith('/api/reports/students/me/github-stats', { params: { groupId: 12 } })
    expect(getMock).toHaveBeenCalledWith('/api/reports/students/me/contribution-summary', { params: { groupId: 12 } })
    expect(getMock).toHaveBeenCalledWith('/api/reports/lecturer/overview', { params: { from: '2026-01-01' } })
    expect(getMock).toHaveBeenCalledWith('/api/reports/lecturer/groups/10/progress', { params: { to: '2026-03-01' } })
    expect(getMock).toHaveBeenCalledWith('/api/reports/lecturer/groups/10/recent-activities', { params: { page: 0, size: 5 } })
  })

  it('sanitizes recent activities query params before request', async () => {
    getMock.mockResolvedValue({ data: { data: { content: [] } } })

    await reportApi.getRecentActivities(10, { page: -2, size: 500, source: 'ALL' })

    expect(getMock).toHaveBeenCalledWith('/api/reports/lecturer/groups/10/recent-activities', {
      params: { page: 0, size: 100 },
    })
  })

  it('covers leader and member report endpoints', async () => {
    getMock.mockResolvedValue({ data: { data: { content: [] } } })
    patchMock.mockResolvedValue({ data: { data: { taskId: 'T-1', status: 'IN_PROGRESS' } } })

    await reportApi.getLeaderGroupTasks(15, { status: 'TODO', page: 0, size: 20 })
    await reportApi.assignLeaderTask(15, 'T-1', { assigneeUserId: 88 })
    await reportApi.updateLeaderTaskStatus(15, 'T-1', { status: 'DONE' })
    await reportApi.getLeaderGroupProgress(15, { from: '2026-01-01', to: '2026-03-01' })
    await reportApi.getLeaderCommitSummary(15, { from: '2026-01-01', to: '2026-03-01' })

    await reportApi.getMemberTasks({ groupId: 15, status: 'TODO', page: 0, size: 20 })
    await reportApi.updateMemberTaskStatus('T-2', 15, { status: 'IN_PROGRESS' })
    await reportApi.getMemberTaskStats(15)
    await reportApi.getMemberCommitStats(15, { from: '2026-01-01', to: '2026-03-01' })

    expect(getMock).toHaveBeenCalledWith('/api/reports/leader/groups/15/tasks', {
      params: { status: 'TODO', page: 0, size: 20 },
    })
    expect(patchMock).toHaveBeenCalledWith('/api/reports/leader/groups/15/tasks/T-1/assignee', {
      assigneeUserId: 88,
    })
    expect(patchMock).toHaveBeenCalledWith('/api/reports/leader/groups/15/tasks/T-1/status', {
      status: 'DONE',
    })
    expect(getMock).toHaveBeenCalledWith('/api/reports/leader/groups/15/progress', {
      params: { from: '2026-01-01', to: '2026-03-01' },
    })
    expect(getMock).toHaveBeenCalledWith('/api/reports/leader/groups/15/commit-summary', {
      params: { from: '2026-01-01', to: '2026-03-01' },
    })

    expect(getMock).toHaveBeenCalledWith('/api/reports/members/me/tasks', {
      params: { groupId: 15, status: 'TODO', page: 0, size: 20 },
    })
    expect(patchMock).toHaveBeenCalledWith(
      '/api/reports/members/me/tasks/T-2/status',
      { status: 'IN_PROGRESS' },
      { params: { groupId: 15 } }
    )
    expect(getMock).toHaveBeenCalledWith('/api/reports/members/me/task-stats', {
      params: { groupId: 15 },
    })
    expect(getMock).toHaveBeenCalledWith('/api/reports/members/me/commit-stats', {
      params: { groupId: 15, from: '2026-01-01', to: '2026-03-01' },
    })
  })
})
