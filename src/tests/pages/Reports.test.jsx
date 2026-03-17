import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Reports from '../../pages/shared/Reports'

const {
  useReportsMock,
  useGenerateReportMock,
  useDownloadReportMock,
  useUserGroupsMock,
  useGroupsMock,
  useProfileMock,
  useProjectConfigByGroupMock,
  refetchReportsMock,
  generateMutateAsyncMock,
  downloadMutateAsyncMock,
} = vi.hoisted(() => ({
  useReportsMock: vi.fn(),
  useGenerateReportMock: vi.fn(),
  useDownloadReportMock: vi.fn(),
  useUserGroupsMock: vi.fn(),
  useGroupsMock: vi.fn(),
  useProfileMock: vi.fn(),
  useProjectConfigByGroupMock: vi.fn(),
  refetchReportsMock: vi.fn(),
  generateMutateAsyncMock: vi.fn(),
  downloadMutateAsyncMock: vi.fn(),
}))

vi.mock('../../layout/DashboardLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../hooks/useReport', () => ({
  useReports: (query) => useReportsMock(query),
  useGenerateReport: () => useGenerateReportMock(),
  useDownloadReport: () => useDownloadReportMock(),
}))

vi.mock('../../hooks/useUserGroups', () => ({
  useGroups: (query, options) => useGroupsMock(query, options),
  useUserGroups: (userId) => useUserGroupsMock(userId),
}))

vi.mock('../../hooks/useAuth', () => ({
  useProfile: () => useProfileMock(),
}))

vi.mock('../../hooks/useProjectConfigs', () => ({
  useProjectConfigByGroup: (groupId) => useProjectConfigByGroupMock(groupId),
}))

describe('Reports page', () => {
  const reportResponsesByStatus = () => ({
    ALL: { data: { content: [], totalPages: 0, totalElements: 0 }, isLoading: false, isFetching: false, refetch: refetchReportsMock },
    COMPLETED: { data: { content: [], totalPages: 0, totalElements: 0 }, isLoading: false, isFetching: false, refetch: refetchReportsMock },
    PROCESSING: { data: { content: [], totalPages: 0, totalElements: 0 }, isLoading: false, isFetching: false, refetch: refetchReportsMock },
    PENDING: { data: { content: [], totalPages: 0, totalElements: 0 }, isLoading: false, isFetching: false, refetch: refetchReportsMock },
    FAILED: { data: { content: [], totalPages: 0, totalElements: 0 }, isLoading: false, isFetching: false, refetch: refetchReportsMock },
  })

  beforeEach(() => {
    useReportsMock.mockReset()
    useGenerateReportMock.mockReset()
    useDownloadReportMock.mockReset()
    useUserGroupsMock.mockReset()
    useGroupsMock.mockReset()
    useProfileMock.mockReset()
    useProjectConfigByGroupMock.mockReset()
    refetchReportsMock.mockReset()
    generateMutateAsyncMock.mockReset()
    downloadMutateAsyncMock.mockReset()

    useReportsMock.mockImplementation((query) => {
      const key = query?.status || 'ALL'
      return reportResponsesByStatus()[key] ?? reportResponsesByStatus().ALL
    })

    useProfileMock.mockReturnValue({
      data: { id: 99, role: 'LECTURER' },
    })

    useGroupsMock.mockReturnValue({
      data: { content: [{ id: 88, groupName: 'OTHER-GROUP', semesterCode: 'FA26' }] },
    })

    useUserGroupsMock.mockReturnValue({
      data: { userId: 99, groups: [{ groupId: 10, groupName: 'SE1705-G1', semesterCode: 'SU26', role: 'LEADER' }] },
    })

    useProjectConfigByGroupMock.mockImplementation((groupId) => {
      if (groupId === 10) {
        return { data: { data: { id: 1010, state: 'VERIFIED' } } }
      }
      return { data: { data: null } }
    })

    useGenerateReportMock.mockReturnValue({
      mutateAsync: generateMutateAsyncMock,
      isPending: false,
    })

    useDownloadReportMock.mockReturnValue({
      mutateAsync: downloadMutateAsyncMock,
      isPending: false,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders loading state while fetching reports', () => {
    useReportsMock.mockImplementation((query) => {
      const key = query?.status || 'ALL'
      if (key === 'ALL') {
        return {
          data: { content: [], totalPages: 0, totalElements: 0 },
          isLoading: true,
          isFetching: false,
          refetch: refetchReportsMock,
        }
      }
      return {
        data: { content: [], totalPages: 0, totalElements: 0 },
        isLoading: false,
        isFetching: false,
        refetch: refetchReportsMock,
      }
    })

    render(<Reports />)

    expect(screen.getByText('Loading reports...')).toBeInTheDocument()
  })

  it('renders empty state when no reports exist', () => {
    render(<Reports />)

    expect(screen.getByText('No reports yet')).toBeInTheDocument()
    expect(screen.getByText('Generate your first SRS report to get started')).toBeInTheDocument()
  })

  it('applies status filter and resets page', async () => {
    render(<Reports />)

    fireEvent.click(screen.getByRole('button', { name: 'COMPLETED' }))

    await waitFor(() => {
      expect(useReportsMock).toHaveBeenCalledWith({ page: 0, size: 10, status: 'COMPLETED' })
    })
  })

  it('generates report successfully when config is verified', async () => {
    generateMutateAsyncMock.mockResolvedValue({ reportId: 'new-id' })
    render(<Reports />)

    fireEvent.click(screen.getByRole('button', { name: /Generate Report/i }))
    fireEvent.change(screen.getByRole('combobox', { name: /Select Group \*/i }), {
      target: { value: '10' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Generate Report$/i }))

    await waitFor(() => {
      expect(generateMutateAsyncMock).toHaveBeenCalledWith({
        projectConfigId: '1010',
        useAi: true,
        exportType: 'DOCX',
      })
    })

    expect(await screen.findByText('Report generation started! It will appear in the list shortly.')).toBeInTheDocument()
    expect(refetchReportsMock).toHaveBeenCalled()
    expect(useUserGroupsMock).toHaveBeenCalledWith(99)
  })

  it('shows download error when download fails', async () => {
    useReportsMock.mockImplementation((query) => {
      const key = query?.status || 'ALL'
      if (key === 'ALL') {
        return {
          data: {
            content: [{ reportId: 'r-1', fileName: 'SRS.docx', type: 'SRS', status: 'COMPLETED', createdAt: '2026-03-10T10:00:00.000Z' }],
            totalPages: 1,
            totalElements: 1,
          },
          isLoading: false,
          isFetching: false,
          refetch: refetchReportsMock,
        }
      }
      if (key === 'COMPLETED') {
        return {
          data: { content: [], totalPages: 1, totalElements: 1 },
          isLoading: false,
          isFetching: false,
          refetch: refetchReportsMock,
        }
      }
      return {
        data: { content: [], totalPages: 0, totalElements: 0 },
        isLoading: false,
        isFetching: false,
        refetch: refetchReportsMock,
      }
    })
    downloadMutateAsyncMock.mockRejectedValue(new Error('download failed'))

    render(<Reports />)

    fireEvent.click(screen.getByRole('button', { name: /Download/i }))

    expect(await screen.findByText('Failed to download report.')).toBeInTheDocument()
  })
})
