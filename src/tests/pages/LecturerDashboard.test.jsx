import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LecturerDashboard from '../../pages/lecturer/LecturerDashboard'

const {
  navigateMock,
  useProfileMock,
  useSemestersMock,
  useGroupsMock,
  useLecturerOverviewMock,
  useGroupProgressMock,
  useRecentActivitiesMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  useProfileMock: vi.fn(),
  useSemestersMock: vi.fn(),
  useGroupsMock: vi.fn(),
  useLecturerOverviewMock: vi.fn(),
  useGroupProgressMock: vi.fn(),
  useRecentActivitiesMock: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('../../layout/DashboardLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../hooks/useAuth', () => ({
  useProfile: () => useProfileMock(),
}))

vi.mock('../../hooks/useUserGroups', () => ({
  useGroups: (query, options) => useGroupsMock(query, options),
  useSemesters: () => useSemestersMock(),
}))

vi.mock('../../hooks/useReport', () => ({
  useLecturerOverview: (query) => useLecturerOverviewMock(query),
  useGroupProgress: (groupId) => useGroupProgressMock(groupId),
  useRecentActivities: (groupId, query) => useRecentActivitiesMock(groupId, query),
}))

describe('LecturerDashboard page', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    useProfileMock.mockReset()
    useSemestersMock.mockReset()
    useGroupsMock.mockReset()
    useLecturerOverviewMock.mockReset()
    useGroupProgressMock.mockReset()
    useRecentActivitiesMock.mockReset()

    useProfileMock.mockReturnValue({ data: { id: 2 }, isLoading: false })
    useSemestersMock.mockReturnValue({ data: [{ id: 1, semesterCode: 'SU26', isActive: true }] })
    useGroupsMock.mockReturnValue({
      data: { content: [{ id: 11, groupName: 'SE1705-G1', semesterId: 1, semesterCode: 'SU26' }] },
      isLoading: false,
    })
    useLecturerOverviewMock.mockReturnValue({
      data: {
        groupCount: 1,
        studentCount: 6,
        taskCount: 12,
        completedTaskCount: 7,
        githubCommitCount: 20,
        githubPrCount: 5,
      },
      isLoading: false,
    })
    useGroupProgressMock.mockReturnValue({
      data: { todoCount: 2, inProgressCount: 5, doneCount: 5, completionRate: 0.5 },
      isLoading: false,
    })
    useRecentActivitiesMock.mockReturnValue({
      data: { content: [{ id: 1, title: 'Synced issues' }] },
      isLoading: false,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders overview, groups, and progress blocks', () => {
    render(<LecturerDashboard />)

    expect(screen.getAllByText('My Groups').length).toBeGreaterThan(0)
    expect(screen.getByText('SE1705-G1')).toBeInTheDocument()
    expect(screen.getByText('Groups')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('Progress Overview')).toBeInTheDocument()
  })

  it('navigates to group details from view group button', async () => {
    render(<LecturerDashboard />)

    fireEvent.click(screen.getByRole('button', { name: 'View Group' }))

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/app/groups/11')
    })
  })

  it('re-queries overview by selected semester', async () => {
    render(<LecturerDashboard />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } })

    await waitFor(() => {
      expect(useLecturerOverviewMock).toHaveBeenLastCalledWith({ semesterId: 1 })
    })
  })
})
