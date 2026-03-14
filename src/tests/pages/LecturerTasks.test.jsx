import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LecturerTasks from '../../pages/lecturer/LecturerTasks'

const {
  useSemestersMock,
  useGroupsMock,
  useGroupProgressMock,
  useRecentActivitiesMock,
} = vi.hoisted(() => ({
  useSemestersMock: vi.fn(),
  useGroupsMock: vi.fn(),
  useGroupProgressMock: vi.fn(),
  useRecentActivitiesMock: vi.fn(),
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

vi.mock('../../hooks/useUserGroups', () => ({
  useGroups: (query) => useGroupsMock(query),
  useSemesters: () => useSemestersMock(),
}))

vi.mock('../../hooks/useReport', () => ({
  useGroupProgress: (groupId) => useGroupProgressMock(groupId),
  useRecentActivities: (groupId, query) => useRecentActivitiesMock(groupId, query),
}))

describe('LecturerTasks page', () => {
  beforeEach(() => {
    useSemestersMock.mockReset()
    useGroupsMock.mockReset()
    useGroupProgressMock.mockReset()
    useRecentActivitiesMock.mockReset()

    useSemestersMock.mockReturnValue({ data: [{ id: 1, semesterCode: 'SU26', isActive: true }] })
    useGroupsMock.mockReturnValue({
      data: { content: [{ id: 7, groupName: 'SE1705-G1' }] },
      isLoading: false,
    })
    useGroupProgressMock.mockReturnValue({
      data: { todoCount: 3, inProgressCount: 4, doneCount: 5, completionRate: 0.5 },
    })
    useRecentActivitiesMock.mockReturnValue({
      data: {
        content: [
          {
            id: 1,
            title: 'JIRA-1',
            externalId: 'JIRA-1',
            url: 'https://jira.local/JIRA-1',
            source: 'JIRA',
            type: 'task',
            author: 'QA',
            occurredAt: '2026-03-10T10:00:00.000Z',
          },
        ],
        totalPages: 1,
        totalElements: 1,
      },
      isLoading: false,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders activity table and progress stats', () => {
    render(<LecturerTasks />)

    expect(screen.getByText('Tasks & Activities')).toBeInTheDocument()
    expect(screen.getAllByText('JIRA-1').length).toBeGreaterThan(0)
    expect(screen.getByText('Completion')).toBeInTheDocument()
  })

  it('applies source filter and re-queries activities', async () => {
    render(<LecturerTasks />)

    const selects = screen.getAllByRole('combobox')
    const sourceSelect = selects[2]
    fireEvent.change(sourceSelect, { target: { value: 'JIRA' } })

    await waitFor(() => {
      expect(useRecentActivitiesMock).toHaveBeenLastCalledWith(7, {
        source: 'JIRA',
        page: 0,
        size: 20,
      })
    })
  })

  it('shows loading state when groups or activities are loading', () => {
    useGroupsMock.mockReturnValue({ data: { content: [] }, isLoading: true })
    useRecentActivitiesMock.mockReturnValue({ data: { content: [] }, isLoading: true })

    render(<LecturerTasks />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
