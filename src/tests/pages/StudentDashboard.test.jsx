import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import StudentDashboard from '../../pages/student/StudentDashboard'

const {
  useProfileMock,
  useUserGroupsMock,
  useGroupMock,
  useGroupMembersMock,
  useLeaderGroupTasksMock,
  useMemberTasksMock,
  useLeaderGroupProgressMock,
  useLeaderCommitSummaryMock,
  useMemberTaskStatsMock,
  useMemberCommitStatsMock,
  useUpdateLeaderTaskStatusMock,
  useUpdateMemberTaskStatusMock,
  useAssignLeaderTaskMock,
  updateLeaderTaskStatusAsyncMock,
  updateMemberTaskStatusAsyncMock,
  assignLeaderTaskAsyncMock,
  mockPathname,
} = vi.hoisted(() => ({
  useProfileMock: vi.fn(),
  useUserGroupsMock: vi.fn(),
  useGroupMock: vi.fn(),
  useGroupMembersMock: vi.fn(),
  useLeaderGroupTasksMock: vi.fn(),
  useMemberTasksMock: vi.fn(),
  useLeaderGroupProgressMock: vi.fn(),
  useLeaderCommitSummaryMock: vi.fn(),
  useMemberTaskStatsMock: vi.fn(),
  useMemberCommitStatsMock: vi.fn(),
  useUpdateLeaderTaskStatusMock: vi.fn(),
  useUpdateMemberTaskStatusMock: vi.fn(),
  useAssignLeaderTaskMock: vi.fn(),
  updateLeaderTaskStatusAsyncMock: vi.fn(),
  updateMemberTaskStatusAsyncMock: vi.fn(),
  assignLeaderTaskAsyncMock: vi.fn(),
  mockPathname: { value: '/app/student/my-work' },
}))

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: mockPathname.value }),
}))

vi.mock('../../layout/DashboardLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../hooks/useAuth', () => ({
  useProfile: () => useProfileMock(),
}))

vi.mock('../../hooks/useUserGroups', () => ({
  useUserGroups: (userId) => useUserGroupsMock(userId),
  useGroup: (groupId) => useGroupMock(groupId),
  useGroupMembers: (groupId) => useGroupMembersMock(groupId),
}))

vi.mock('../../hooks/useReport', () => ({
  useLeaderGroupTasks: (groupId, query) => useLeaderGroupTasksMock(groupId, query),
  useMemberTasks: (query) => useMemberTasksMock(query),
  useLeaderGroupProgress: (groupId, query) => useLeaderGroupProgressMock(groupId, query),
  useLeaderCommitSummary: (groupId, query) => useLeaderCommitSummaryMock(groupId, query),
  useMemberTaskStats: (groupId) => useMemberTaskStatsMock(groupId),
  useMemberCommitStats: (groupId, query) => useMemberCommitStatsMock(groupId, query),
  useUpdateLeaderTaskStatus: () => useUpdateLeaderTaskStatusMock(),
  useUpdateMemberTaskStatus: () => useUpdateMemberTaskStatusMock(),
  useAssignLeaderTask: () => useAssignLeaderTaskMock(),
}))

describe('StudentDashboard page', () => {
  beforeEach(() => {
    useProfileMock.mockReset()
    useUserGroupsMock.mockReset()
    useGroupMock.mockReset()
    useGroupMembersMock.mockReset()
    useLeaderGroupTasksMock.mockReset()
    useMemberTasksMock.mockReset()
    useLeaderGroupProgressMock.mockReset()
    useLeaderCommitSummaryMock.mockReset()
    useMemberTaskStatsMock.mockReset()
    useMemberCommitStatsMock.mockReset()
    useUpdateLeaderTaskStatusMock.mockReset()
    useUpdateMemberTaskStatusMock.mockReset()
    useAssignLeaderTaskMock.mockReset()
    updateLeaderTaskStatusAsyncMock.mockReset()
    updateMemberTaskStatusAsyncMock.mockReset()
    assignLeaderTaskAsyncMock.mockReset()
    mockPathname.value = '/app/student/my-work'

    useProfileMock.mockReturnValue({
      data: { id: 21, fullName: 'Student A' },
      isLoading: false,
    })

    useUserGroupsMock.mockReturnValue({
      data: { groups: [{ groupId: 12, groupName: 'SE1705-G1', semesterCode: 'SU26', role: 'MEMBER' }] },
      isLoading: false,
    })

    useGroupMembersMock.mockReturnValue({ data: [{ userId: 31, fullName: 'Member One' }] })
    useGroupMock.mockReturnValue({
      data: {
        members: [{ userId: 31, fullName: 'Member One', role: 'MEMBER' }],
      },
    })

    useLeaderGroupTasksMock.mockReturnValue({
      data: { content: [], totalPages: 0, totalElements: 0 },
      isLoading: false,
    })

    useMemberTasksMock.mockImplementation((query) => {
      if (query?.status === 'TODO') {
        return {
          data: {
            content: [
              {
                taskId: 2,
                key: 'TASK-2',
                title: 'Todo task',
                source: 'JIRA',
                status: 'TODO',
                priority: 'LOW',
                updatedAt: '2026-03-11T08:00:00.000Z',
                url: 'https://jira.local/TASK-2',
              },
            ],
            totalPages: 1,
            totalElements: 1,
          },
          isLoading: false,
        }
      }

      return {
        data: {
          content: [
            {
              taskId: 1,
              key: 'TASK-1',
              title: 'Implement feature',
              source: 'JIRA',
              status: 'IN_PROGRESS',
              priority: 'HIGH',
              updatedAt: '2026-03-10T10:00:00.000Z',
              url: 'https://jira.local/TASK-1',
            },
          ],
          totalPages: 1,
          totalElements: 1,
        },
        isLoading: false,
      }
    })

    useLeaderGroupProgressMock.mockReturnValue({ data: { todoCount: 0, inProgressCount: 0, doneCount: 0, completionRate: 0 } })
    useLeaderCommitSummaryMock.mockReturnValue({ data: { totalCommits: 0, totalPullRequests: 0, activeContributors: 0 } })

    useMemberTaskStatsMock.mockReturnValue({
      data: {
        totalAssigned: 10,
        completed: 7,
        inProgress: 2,
        todo: 1,
        completionRate: 0.7,
      },
    })

    useMemberCommitStatsMock.mockReturnValue({
      data: {
        commitCount: 14,
        prCount: 3,
        activeDays: 6,
      },
    })

    useUpdateLeaderTaskStatusMock.mockReturnValue({ mutateAsync: updateLeaderTaskStatusAsyncMock, isPending: false })
    useUpdateMemberTaskStatusMock.mockReturnValue({ mutateAsync: updateMemberTaskStatusAsyncMock, isPending: false })
    useAssignLeaderTaskMock.mockReturnValue({ mutateAsync: assignLeaderTaskAsyncMock, isPending: false })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders loading state while profile or tasks are loading', () => {
    useProfileMock.mockReturnValue({ data: null, isLoading: true })
    useUserGroupsMock.mockReturnValue({ data: { groups: [] }, isLoading: false })
    useMemberTasksMock.mockReturnValue({ data: { content: [] }, isLoading: false })

    render(<StudentDashboard />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders empty state when no tasks exist', () => {
    useMemberTasksMock.mockReturnValue({
      data: { content: [], totalPages: 0, totalElements: 0 },
      isLoading: false,
    })
    useMemberTaskStatsMock.mockReturnValue({ data: undefined })
    useMemberCommitStatsMock.mockReturnValue({ data: undefined })

    render(<StudentDashboard />)

    expect(screen.getByText('No tasks found.')).toBeInTheDocument()
    expect(screen.getByText('My Statistics')).toBeInTheDocument()
  })

  it('renders task list and contribution summary in success state', () => {
    render(<StudentDashboard />)

    expect(screen.getAllByText('My Work').length).toBeGreaterThan(0)
    expect(screen.getByText('TASK-1')).toBeInTheDocument()
    expect(screen.getByText('Implement feature')).toBeInTheDocument()
    expect(screen.getByText(/Group:\s*SE1705-G1/)).toBeInTheDocument()
    expect(screen.getByText('Total Assigned')).toBeInTheDocument()
    expect(screen.getByText('Commits')).toBeInTheDocument()
  })

  it('applies TODO filter and re-queries tasks with status', async () => {
    render(<StudentDashboard />)

    fireEvent.click(screen.getByRole('button', { name: 'To Do' }))

    await waitFor(() => {
      expect(useMemberTasksMock).toHaveBeenLastCalledWith({ groupId: 12, page: 0, size: 10, status: 'TODO' })
    })
    expect(screen.getByText('TASK-2')).toBeInTheDocument()
  })

  it('renders leader controls and uses leader hooks when role is LEADER', () => {
    mockPathname.value = '/app/student/team-board'
    useUserGroupsMock.mockReturnValue({
      data: { groups: [{ groupId: 12, groupName: 'SE1705-G1', semesterCode: 'SU26', role: 'LEADER' }] },
      isLoading: false,
    })
    useLeaderGroupTasksMock.mockReturnValue({
      data: {
        content: [{
          taskId: 'L-1',
          key: 'L-1',
          title: 'Leader task',
          source: 'JIRA',
          status: 'TODO',
          priority: 'MEDIUM',
          updatedAt: '2026-03-11T08:00:00.000Z',
          url: 'https://jira.local/L-1',
        }],
        totalPages: 1,
        totalElements: 1,
      },
      isLoading: false,
    })

    render(<StudentDashboard />)

    expect(screen.getByText('Team Statistics')).toBeInTheDocument()
    expect(screen.getByText('Member')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Member One' })).toBeInTheDocument()
    expect(screen.getAllByText('Assign').length).toBeGreaterThan(0)
    expect(useLeaderGroupTasksMock).toHaveBeenCalledWith(12, { page: 0, size: 10 })
  })

  it('uses personal member hooks on my-work even when selected role is LEADER', () => {
    mockPathname.value = '/app/student/my-work'
    useUserGroupsMock.mockReturnValue({
      data: { groups: [{ groupId: 12, groupName: 'SE1705-G1', semesterCode: 'SU26', role: 'LEADER' }] },
      isLoading: false,
    })

    render(<StudentDashboard />)

    expect(screen.getByText('My Statistics')).toBeInTheDocument()
    expect(useLeaderGroupTasksMock).toHaveBeenCalledWith(0, { page: 0, size: 10 })
    expect(useMemberTasksMock).toHaveBeenCalledWith({ groupId: 12, page: 0, size: 10 })
  })
})
