import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import StudentStats from '../../pages/student/StudentStats'

const {
  useProfileMock,
  useUserGroupsMock,
  useStudentGithubStatsMock,
  useStudentContributionMock,
} = vi.hoisted(() => ({
  useProfileMock: vi.fn(),
  useUserGroupsMock: vi.fn(),
  useStudentGithubStatsMock: vi.fn(),
  useStudentContributionMock: vi.fn(),
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
  useStudentGithubStats: (query) => useStudentGithubStatsMock(query),
  useStudentContribution: (query) => useStudentContributionMock(query),
}))

describe('StudentStats page', () => {
  beforeEach(() => {
    useProfileMock.mockReset()
    useUserGroupsMock.mockReset()
    useStudentGithubStatsMock.mockReset()
    useStudentContributionMock.mockReset()

    useProfileMock.mockReturnValue({ data: { id: 20 }, isLoading: false })
    useUserGroupsMock.mockReturnValue({
      data: { groups: [{ groupId: 11, groupName: 'SE1705-G1', semesterCode: 'SU26' }] },
      isLoading: false,
    })
    useStudentGithubStatsMock.mockReturnValue({
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
    useStudentContributionMock.mockReturnValue({
      data: {
        taskCount: 10,
        completedTaskCount: 8,
        contributionScore: 88,
        recentHighlights: ['Merged API PR'],
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

    expect(screen.getByText('GitHub Statistics')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Pull Requests')).toBeInTheDocument()
    expect(screen.getByText('Merged API PR')).toBeInTheDocument()
  })

  it('updates queries when selecting group and date range', async () => {
    const { container } = render(<StudentStats />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '11' } })
    const dateInputs = container.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-03-01' } })
    fireEvent.change(dateInputs[1], { target: { value: '2026-03-10' } })

    await waitFor(() => {
      expect(useStudentGithubStatsMock).toHaveBeenLastCalledWith({
        groupId: 11,
        from: '2026-03-01',
        to: '2026-03-10',
      })
    })
  })
})
