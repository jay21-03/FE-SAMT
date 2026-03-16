import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  retryUnlessForbidden,
  useDownloadReport,
  useGenerateReport,
  useGroupProgress,
  useLecturerOverview,
  useRecentActivities,
  useReport,
  useReports,
  useStudentContribution,
  useStudentGithubStats,
  useStudentTasks,
} from '../../hooks/useReport'

const {
  getReportMock,
  listReportsMock,
  getStudentTasksMock,
  getStudentGithubStatsMock,
  getStudentContributionSummaryMock,
  getLecturerOverviewMock,
  getGroupProgressMock,
  getRecentActivitiesMock,
  generateSrsReportMock,
  downloadReportMock,
} = vi.hoisted(() => ({
  getReportMock: vi.fn(),
  listReportsMock: vi.fn(),
  getStudentTasksMock: vi.fn(),
  getStudentGithubStatsMock: vi.fn(),
  getStudentContributionSummaryMock: vi.fn(),
  getLecturerOverviewMock: vi.fn(),
  getGroupProgressMock: vi.fn(),
  getRecentActivitiesMock: vi.fn(),
  generateSrsReportMock: vi.fn(),
  downloadReportMock: vi.fn(),
}))

vi.mock('../../api/reportApi.ts', () => ({
  reportApi: {
    getReport: getReportMock,
    listReports: listReportsMock,
    getStudentTasks: getStudentTasksMock,
    getStudentGithubStats: getStudentGithubStatsMock,
    getStudentContributionSummary: getStudentContributionSummaryMock,
    getLecturerOverview: getLecturerOverviewMock,
    getGroupProgress: getGroupProgressMock,
    getRecentActivities: getRecentActivitiesMock,
    generateSrsReport: generateSrsReportMock,
    downloadReport: downloadReportMock,
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

describe('useReport', () => {
  beforeEach(() => {
    getReportMock.mockReset()
    listReportsMock.mockReset()
    getStudentTasksMock.mockReset()
    getStudentGithubStatsMock.mockReset()
    getStudentContributionSummaryMock.mockReset()
    getLecturerOverviewMock.mockReset()
    getGroupProgressMock.mockReset()
    getRecentActivitiesMock.mockReset()
    generateSrsReportMock.mockReset()
    downloadReportMock.mockReset()
  })

  it('applies retry predicate rules for forbidden and transient errors', () => {
    expect(retryUnlessForbidden(0, { response: { status: 403 } })).toBe(false)
    expect(retryUnlessForbidden(0, { response: { status: 500 } })).toBe(true)
    expect(retryUnlessForbidden(2, { response: { status: 500 } })).toBe(false)
  })

  it('does not call API when reportId is empty (enabled guard)', async () => {
    const { result } = renderHook(() => useReport(''), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(getReportMock).not.toHaveBeenCalled()
  })

  it('exposes loading state while fetching', () => {
    getReportMock.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useReport('report-1'), {
      wrapper: wrapperFactory(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(getReportMock).toHaveBeenCalledWith('report-1')
  })

  it('exposes error state when API fails', async () => {
    const error = new Error('report service unavailable')
    getReportMock.mockRejectedValue(error)

    const { result } = renderHook(() => useReport('report-2'), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBe(error)
  })

  it('returns report data shape from API response', async () => {
    const report = {
      reportId: 'r-100',
      type: 'SRS',
      title: 'Sprint 1',
    }
    getReportMock.mockResolvedValue(report)

    const { result } = renderHook(() => useReport('r-100'), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(report)
  })

  it('fetches reports list and returns mapped page response', async () => {
    listReportsMock.mockResolvedValue({ content: [{ reportId: 'r-1' }], totalElements: 1 })

    const { result } = renderHook(() => useReports({ page: 0, size: 10 }), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listReportsMock).toHaveBeenCalledWith({ page: 0, size: 10 })
    expect(result.current.data?.content).toEqual([{ reportId: 'r-1' }])
  })

  it('fetches student tasks data', async () => {
    getStudentTasksMock.mockResolvedValue({ content: [{ taskId: 11 }] })

    const { result } = renderHook(() => useStudentTasks({ page: 0, size: 5 }), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getStudentTasksMock).toHaveBeenCalledWith({ page: 0, size: 5 })
    expect(result.current.data?.content).toEqual([{ taskId: 11 }])
  })

  it('does not call student github stats API for non-positive group id', async () => {
    const { result } = renderHook(
      () => useStudentGithubStats({ groupId: 0, from: '2026-01-01', to: '2026-01-31' }),
      {
        wrapper: wrapperFactory(),
      },
    )

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(getStudentGithubStatsMock).not.toHaveBeenCalled()
  })

  it('fetches student github stats and contribution when group id is valid', async () => {
    getStudentGithubStatsMock.mockResolvedValue({ commitCount: 12 })
    getStudentContributionSummaryMock.mockResolvedValue({ totalPoints: 88 })

    const githubStatsHook = renderHook(
      () => useStudentGithubStats({ groupId: 3, from: '2026-01-01', to: '2026-01-31' }),
      { wrapper: wrapperFactory() },
    )
    const contributionHook = renderHook(
      () => useStudentContribution({ groupId: 3, from: '2026-01-01', to: '2026-01-31' }),
      { wrapper: wrapperFactory() },
    )

    await waitFor(() => expect(githubStatsHook.result.current.isSuccess).toBe(true))
    await waitFor(() => expect(contributionHook.result.current.isSuccess).toBe(true))

    expect(getStudentGithubStatsMock).toHaveBeenCalledWith({ groupId: 3, from: '2026-01-01', to: '2026-01-31' })
    expect(getStudentContributionSummaryMock).toHaveBeenCalledWith({ groupId: 3, from: '2026-01-01', to: '2026-01-31' })
  })

  it('fetches lecturer overview metrics', async () => {
    getLecturerOverviewMock.mockResolvedValue({ totalGroups: 4 })

    const { result } = renderHook(() => useLecturerOverview({ from: '2026-01-01' }), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getLecturerOverviewMock).toHaveBeenCalledWith({ from: '2026-01-01' })
  })

  it('fetches group progress when group id is valid', async () => {
    getGroupProgressMock.mockResolvedValue({ completionRate: 80 })

    const { result } = renderHook(() => useGroupProgress(12, { from: '2026-01-01', to: '2026-01-31' }), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getGroupProgressMock).toHaveBeenCalledWith(12, { from: '2026-01-01', to: '2026-01-31' })
    expect(result.current.data).toEqual({ completionRate: 80 })
  })

  it('does not call group progress API when group id is invalid', async () => {
    const { result } = renderHook(() => useGroupProgress(0, { from: '2026-01-01', to: '2026-01-31' }), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(getGroupProgressMock).not.toHaveBeenCalled()
  })

  it('does not retry group progress when backend returns forbidden', async () => {
    getGroupProgressMock.mockRejectedValue({ response: { status: 403 } })

    const forbiddenErrorHook = renderHook(() => useGroupProgress(10, { from: '2026-01-01' }), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(forbiddenErrorHook.result.current.isError).toBe(true))
    expect(getGroupProgressMock).toHaveBeenCalledTimes(1)
  })

  it('fetches recent activities with valid group id', async () => {
    getRecentActivitiesMock.mockResolvedValue({ content: [{ id: 1, action: 'SYNC' }] })

    const { result } = renderHook(() => useRecentActivities(4, { page: 0, size: 5 }), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getRecentActivitiesMock).toHaveBeenCalledWith(4, { page: 0, size: 5 })
    expect(result.current.data?.content).toEqual([{ id: 1, action: 'SYNC' }])
  })

  it('does not fetch recent activities for invalid group id and does not retry 403', async () => {
    const disabledHook = renderHook(() => useRecentActivities(0, { page: 0, size: 5 }), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(disabledHook.result.current.fetchStatus).toBe('idle'))
    expect(getRecentActivitiesMock).not.toHaveBeenCalled()

    getRecentActivitiesMock.mockRejectedValue({ response: { status: 403 } })

    const forbiddenHook = renderHook(() => useRecentActivities(8, { page: 0, size: 5 }), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(forbiddenHook.result.current.isError).toBe(true))
    expect(getRecentActivitiesMock).toHaveBeenCalledTimes(1)
  })

  it('invalidates reports query on generate report success', async () => {
    generateSrsReportMock.mockResolvedValue({ reportId: 'new-report' })

    const { result } = renderHook(() => useGenerateReport(), {
      wrapper: wrapperFactory(),
    })

    await result.current.mutateAsync({ projectConfigId: 1, useAi: true, exportType: 'DOCX' })

    expect(generateSrsReportMock).toHaveBeenCalledWith({ projectConfigId: 1, useAi: true, exportType: 'DOCX' })
  })

  it('triggers report download mutation', async () => {
    downloadReportMock.mockResolvedValue({ url: 'blob:test', fileName: 'report.docx' })
    const appendChildSpy = vi.spyOn(document.body, 'appendChild')
    const removeChildSpy = vi.spyOn(document.body, 'removeChild')
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    if (typeof window.URL.revokeObjectURL !== 'function') {
      Object.defineProperty(window.URL, 'revokeObjectURL', {
        value: vi.fn(),
        configurable: true,
      })
    }
    const revokeSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => undefined)

    const { result } = renderHook(() => useDownloadReport(), {
      wrapper: wrapperFactory(),
    })

    await result.current.mutateAsync('report-download-1')

    expect(downloadReportMock).toHaveBeenCalledWith('report-download-1')
    expect(appendChildSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()
    expect(revokeSpy).toHaveBeenCalledWith('blob:test')

    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
    clickSpy.mockRestore()
    revokeSpy.mockRestore()
  })

  it('uses fallback filename when download response has no content-disposition', async () => {
    downloadReportMock.mockResolvedValue({ url: 'blob:fallback', fileName: 'report_report-9.docx' })
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    if (typeof window.URL.revokeObjectURL !== 'function') {
      Object.defineProperty(window.URL, 'revokeObjectURL', {
        value: vi.fn(),
        configurable: true,
      })
    }
    const revokeSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => undefined)

    const { result } = renderHook(() => useDownloadReport(), {
      wrapper: wrapperFactory(),
    })

    await result.current.mutateAsync('report-9')

    expect(downloadReportMock).toHaveBeenCalledWith('report-9')

    clickSpy.mockRestore()
    revokeSpy.mockRestore()
  })
})
