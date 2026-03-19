import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import StudentDashboard from '../../pages/student/StudentDashboard'

const {
  useProfileMock,
  useUserGroupsMock,
  useMemberTasksMock,
  useStudentContributionMock,
  useUpdateMemberTaskStatusMock,
} = vi.hoisted(() => ({
  useProfileMock: vi.fn(),
  useUserGroupsMock: vi.fn(),
  useMemberTasksMock: vi.fn(),
  useStudentContributionMock: vi.fn(),
  useUpdateMemberTaskStatusMock: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
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
  useUserGroups: (userId) => useUserGroupsMock(userId),
}))

vi.mock('../../hooks/useReport', () => ({
  useMemberTasks: (query) => useMemberTasksMock(query),
  useStudentContribution: (query) => useStudentContributionMock(query),
  useUpdateMemberTaskStatus: () => useUpdateMemberTaskStatusMock(),
}))

describe('StudentDashboard page', () => {
  beforeEach(() => {
    useProfileMock.mockReset()
    useUserGroupsMock.mockReset()
    useMemberTasksMock.mockReset()
    useStudentContributionMock.mockReset()
    useUpdateMemberTaskStatusMock.mockReset()

    useProfileMock.mockReturnValue({
      data: { id: 21, fullName: 'Student A' },
      isLoading: false,
    })

    useUserGroupsMock.mockReturnValue({
      data: { groups: [{ groupId: 12, groupName: 'SE1705-G1', semesterCode: 'SU26', role: 'MEMBER' }] },
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

    useStudentContributionMock.mockReturnValue({
      data: {
        taskCount: 10,
        completedTaskCount: 7,
        githubCommitCount: 14,
        githubPrCount: 3,
        contributionScore: 70,
        recentHighlights: [],
      },
    })

    useUpdateMemberTaskStatusMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
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
    useStudentContributionMock.mockReturnValue({ data: undefined })

    render(<StudentDashboard />)

    expect(screen.getByText('No tasks found.')).toBeInTheDocument()
    expect(screen.getByText('My Statistics')).toBeInTheDocument()
  })

  it('renders task list and contribution summary in success state', () => {
    render(<StudentDashboard />)

    expect(screen.getAllByText('My Tasks').length).toBeGreaterThan(0)
    expect(screen.getByText('TASK-1')).toBeInTheDocument()
    expect(screen.getByText('Implement feature')).toBeInTheDocument()
    expect(screen.getByText(/Group:\s*SE1705-G1/)).toBeInTheDocument()
    expect(screen.getByText('GitHub Commits')).toBeInTheDocument()
  })

  it('applies TODO filter and re-queries tasks with status', async () => {
    render(<StudentDashboard />)

    fireEvent.click(screen.getByRole('button', { name: 'To Do' }))

    await waitFor(() => {
      expect(useMemberTasksMock).toHaveBeenLastCalledWith({ groupId: 12, page: 0, size: 10, status: 'TODO' })
    })
    expect(screen.getByText('TASK-2')).toBeInTheDocument()
  })

  it('maps In Design and Approved filters to backend statuses', async () => {
    render(<StudentDashboard />)

    fireEvent.click(screen.getByRole('button', { name: 'In Design' }))
    await waitFor(() => {
      expect(useMemberTasksMock).toHaveBeenLastCalledWith({
        groupId: 12,
        page: 0,
        size: 10,
        status: 'IN_PROGRESS',
      })
    })

    fireEvent.click(screen.getByRole('button', { name: 'Approved' }))
    await waitFor(() => {
      expect(useMemberTasksMock).toHaveBeenLastCalledWith({
        groupId: 12,
        page: 0,
        size: 10,
        status: 'DONE',
      })
    })
  })

  // Team-board and leader features are covered by separate pages/components.
})
