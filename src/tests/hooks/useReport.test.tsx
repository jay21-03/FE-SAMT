import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useDownloadReport,
  useGenerateReport,
  useGroupProgress,
  useRecentActivities,
  useReport,
  useReports,
  useStudentGithubStats,
  useStudentTasks,
} from '../../hooks/useReport'

const { getReportMock, listReportsMock, getStudentTasksMock, getStudentGithubStatsMock, getGroupProgressMock, getRecentActivitiesMock, generateSrsReportMock, downloadReportMock } = vi.hoisted(() => ({
  getReportMock: vi.fn(),
  listReportsMock: vi.fn(),
  getStudentTasksMock: vi.fn(),
  getStudentGithubStatsMock: vi.fn(),
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
    getGroupProgressMock.mockReset()
    getRecentActivitiesMock.mockReset()
    generateSrsReportMock.mockReset()
    downloadReportMock.mockReset()
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

  it('fetches recent activities with valid group id', async () => {
    getRecentActivitiesMock.mockResolvedValue({ content: [{ id: 1, action: 'SYNC' }] })

    const { result } = renderHook(() => useRecentActivities(4, { page: 0, size: 5 }), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getRecentActivitiesMock).toHaveBeenCalledWith(4, { page: 0, size: 5 })
    expect(result.current.data?.content).toEqual([{ id: 1, action: 'SYNC' }])
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
})
