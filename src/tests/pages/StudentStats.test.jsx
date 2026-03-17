import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import StudentStats from '../../pages/student/StudentStats'

const {
  useProfileMock,
  useUserGroupsMock,
  useLeaderGroupProgressMock,
  useLeaderCommitSummaryMock,
  useMemberTaskStatsMock,
  useMemberCommitStatsMock,
} = vi.hoisted(() => ({
  useProfileMock: vi.fn(),
  useUserGroupsMock: vi.fn(),
  useLeaderGroupProgressMock: vi.fn(),
  useLeaderCommitSummaryMock: vi.fn(),
  useMemberTaskStatsMock: vi.fn(),
  useMemberCommitStatsMock: vi.fn(),
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
  useLeaderGroupProgress: (groupId, query) => useLeaderGroupProgressMock(groupId, query),
  useLeaderCommitSummary: (groupId, query) => useLeaderCommitSummaryMock(groupId, query),
  useMemberTaskStats: (groupId) => useMemberTaskStatsMock(groupId),
  useMemberCommitStats: (groupId, query) => useMemberCommitStatsMock(groupId, query),
}))

describe('StudentStats page', () => {
  beforeEach(() => {
    useProfileMock.mockReset()
    useUserGroupsMock.mockReset()
    useLeaderGroupProgressMock.mockReset()
    useLeaderCommitSummaryMock.mockReset()
    useMemberTaskStatsMock.mockReset()
    useMemberCommitStatsMock.mockReset()

    useProfileMock.mockReturnValue({ data: { id: 20 }, isLoading: false })
    useUserGroupsMock.mockReturnValue({
      data: { groups: [{ groupId: 11, groupName: 'SE1705-G1', semesterCode: 'SU26', role: 'MEMBER' }] },
      isLoading: false,
    })
    useLeaderGroupProgressMock.mockReturnValue({ data: { todoCount: 0, inProgressCount: 0, doneCount: 0, completionRate: 0 }, isLoading: false })
    useLeaderCommitSummaryMock.mockReturnValue({ data: { totalCommits: 0, totalPullRequests: 0, activeContributors: 0 }, isLoading: false })
    useMemberCommitStatsMock.mockReturnValue({
      data: {
        commitCount: 12,
        prCount: 5,
        mergedPrCount: 4,
        reviewCount: 6,
        activeDays: 8,
        lastCommitAt: '2026-03-10T00:00:00.000Z',
      },
      isLoading: false,
    })
    useMemberTaskStatsMock.mockReturnValue({
      data: {
        totalAssigned: 10,
        completed: 8,
        inProgress: 1,
        todo: 1,
        completionRate: 0.8,
      },
      isLoading: false,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders loading state while profile is loading', () => {
    useProfileMock.mockReturnValue({ data: null, isLoading: true })
    render(<StudentStats />)

    expect(screen.getByText('Loading statistics...')).toBeInTheDocument()
  })

  it('renders github stats and contribution summary', () => {
    render(<StudentStats />)

    expect(screen.getByText('Team Board')).toBeInTheDocument()
    expect(screen.getByText('My Work')).toBeInTheDocument()
    expect(screen.getByText('GitHub Statistics')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Pull Requests')).toBeInTheDocument()
    expect(screen.getByText('Task Summary')).toBeInTheDocument()
  })

  it('updates queries when selecting group and date range', async () => {
    const { container } = render(<StudentStats />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '11' } })
    const dateInputs = container.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-03-01' } })
    fireEvent.change(dateInputs[1], { target: { value: '2026-03-10' } })

    await waitFor(() => {
      expect(useMemberCommitStatsMock).toHaveBeenLastCalledWith(11, {
        from: '2026-03-01',
        to: '2026-03-10',
      })
    })
  })

  it('switches to leader widgets when selected role is LEADER', () => {
    useUserGroupsMock.mockReturnValue({
      data: { groups: [{ groupId: 11, groupName: 'SE1705-G1', semesterCode: 'SU26', role: 'LEADER' }] },
      isLoading: false,
    })
    useLeaderGroupProgressMock.mockReturnValue({
      data: { todoCount: 3, inProgressCount: 4, doneCount: 10, completionRate: 0.59 },
      isLoading: false,
    })
    useLeaderCommitSummaryMock.mockReturnValue({
      data: { totalCommits: 120, totalPullRequests: 15, activeContributors: 5 },
      isLoading: false,
    })

    render(<StudentStats />)

    expect(screen.getByText('Team Stats')).toBeInTheDocument()
    expect(screen.getByText('Team Commit Summary')).toBeInTheDocument()
    expect(useLeaderGroupProgressMock).toHaveBeenCalledWith(11, {})
    expect(useLeaderCommitSummaryMock).toHaveBeenCalledWith(11, {})
  })
})
