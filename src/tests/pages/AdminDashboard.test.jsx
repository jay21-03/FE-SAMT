import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminDashboard from '../../pages/admin/AdminDashboard'

const { useUsersMock, useGroupsMock } = vi.hoisted(() => ({
  useUsersMock: vi.fn(),
  useGroupsMock: vi.fn(),
}))

vi.mock('../../layout/DashboardLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../hooks/useUserGroups', () => ({
  useUsers: (query) => useUsersMock(query),
  useGroups: (query) => useGroupsMock(query),
}))

describe('AdminDashboard page', () => {
  beforeEach(() => {
    useUsersMock.mockReset()
    useGroupsMock.mockReset()

    useUsersMock.mockReturnValue({
      data: {
        content: [{ id: 1, fullName: 'QA Admin', roles: ['ADMIN'], status: 'ACTIVE' }],
        totalElements: 12,
      },
      isLoading: false,
    })

    useGroupsMock.mockReturnValue({
      data: {
        content: [{ id: 10, groupName: 'SE1705-G1', lecturerName: 'Dr QA', memberCount: 6 }],
        totalElements: 4,
      },
      isLoading: false,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders dashboard data in success state', () => {
    render(<AdminDashboard />)

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    expect(screen.getByText('QA Admin')).toBeInTheDocument()
    expect(screen.getByText('SE1705-G1')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getAllByText('4').length).toBeGreaterThan(0)
  })

  it('renders loading placeholders when hooks are loading', () => {
    useUsersMock.mockReturnValue({ data: { content: [], totalElements: 0 }, isLoading: true })
    useGroupsMock.mockReturnValue({ data: { content: [], totalElements: 0 }, isLoading: true })

    render(<AdminDashboard />)

    expect(screen.getAllByText('Loading...').length).toBeGreaterThan(0)
  })

  it('renders empty table state when no users/groups exist', () => {
    useUsersMock.mockReturnValue({ data: { content: [], totalElements: 0 }, isLoading: false })
    useGroupsMock.mockReturnValue({ data: { content: [], totalElements: 0 }, isLoading: false })

    render(<AdminDashboard />)

    expect(screen.getAllByText('No data').length).toBe(2)
  })
})
