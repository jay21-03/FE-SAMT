import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import StudentPermissions from '../../pages/student/StudentPermissions'

const { useProfileMock, useUserGroupsMock } = vi.hoisted(() => ({
  useProfileMock: vi.fn(),
  useUserGroupsMock: vi.fn(),
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

describe('StudentPermissions page', () => {
  beforeEach(() => {
    useProfileMock.mockReset()
    useUserGroupsMock.mockReset()

    useProfileMock.mockReturnValue({
      data: { id: 21 },
      isLoading: false,
    })

    useUserGroupsMock.mockReturnValue({
      data: { groups: [{ groupId: 11, role: 'MEMBER', groupName: 'SE1705-G1' }] },
      isLoading: false,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders role from backend membership', () => {
    render(<StudentPermissions />)

    expect(screen.getByText('Current GroupRole: MEMBER')).toBeInTheDocument()
    expect(screen.getByText('Leader')).toBeInTheDocument()
    expect(screen.getByText('Member')).toBeInTheDocument()
  })

  it('renders leader role from backend membership', () => {
    useUserGroupsMock.mockReturnValue({
      data: { groups: [{ groupId: 22, role: 'LEADER', groupName: 'SE1705-G2' }] },
      isLoading: false,
    })

    render(<StudentPermissions />)

    expect(screen.getByText('Current GroupRole: LEADER')).toBeInTheDocument()
  })
})
