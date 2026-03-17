import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import StudentPermissions from '../../pages/student/StudentPermissions'

const mockUseUserGroups = vi.fn()

vi.mock('../../layout/DashboardLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../hooks/useAuth', () => ({
  useProfile: () => ({
    data: { id: 10 },
    isLoading: false,
  }),
}))

vi.mock('../../hooks/useUserGroups', () => ({
  useUserGroups: (userId) => mockUseUserGroups(userId),
}))

describe('StudentPermissions page', () => {
  beforeEach(() => {
    localStorage.clear()
    mockUseUserGroups.mockReturnValue({
      data: { groups: [] },
      isLoading: false,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders default MEMBER role when group_role is missing', () => {
    render(<StudentPermissions />)

    expect(screen.getByText('Current GroupRole: MEMBER')).toBeInTheDocument()
    expect(screen.getByText('Leader')).toBeInTheDocument()
    expect(screen.getByText('Member')).toBeInTheDocument()
  })

  it('renders LEADER role from current membership', async () => {
    mockUseUserGroups.mockReturnValue({
      data: {
        groups: [
          {
            groupId: 1,
            groupName: 'SE1701',
            semesterCode: 'SPRING26',
            role: 'LEADER',
          },
        ],
      },
      isLoading: false,
    })

    render(<StudentPermissions />)

    expect(screen.getByText('Current GroupRole: LEADER')).toBeInTheDocument()
  })
})
