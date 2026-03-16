import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reportApi } from '../../../api/reportApi'

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

describe('reportApi', () => {
  beforeEach(() => {
    getMock.mockReset()
    postMock.mockReset()
  })

  it('generates report and fetches metadata/list', async () => {
    postMock.mockResolvedValue({ data: { data: { reportId: 'r-1' } } })
    getMock
      .mockResolvedValueOnce({ data: { data: { reportId: 'r-1', type: 'SRS' } } })
      .mockResolvedValueOnce({ data: { data: { content: [{ reportId: 'r-1' }], totalElements: 1 } } })

    const generated = await reportApi.generateSrsReport({ projectConfigId: 1, useAi: true, exportType: 'DOCX' })
    const metadata = await reportApi.getReport('r-1')
    const list = await reportApi.listReports({ page: 0, size: 10 })

    expect(postMock).toHaveBeenCalledWith('/api/reports/srs', { projectConfigId: 1, useAi: true, exportType: 'DOCX' })
    expect(getMock).toHaveBeenCalledWith('/api/reports/r-1')
    expect(getMock).toHaveBeenCalledWith('/api/reports', { params: { page: 0, size: 10 } })
    expect(generated).toEqual({ reportId: 'r-1' })
    expect(metadata).toEqual({ reportId: 'r-1', type: 'SRS' })
    expect(list).toEqual({ content: [{ reportId: 'r-1' }], totalElements: 1 })
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

    const result = await reportApi.downloadReport('r-9')

    expect(getMock).toHaveBeenCalledWith('/api/reports/r-9/download', { responseType: 'blob' })
    expect(result).toEqual({ url: 'blob:fallback-url', fileName: 'report_r-9.docx' })

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
})
