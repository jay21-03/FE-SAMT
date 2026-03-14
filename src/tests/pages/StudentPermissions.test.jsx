import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import StudentPermissions from '../../pages/student/StudentPermissions'

vi.mock('../../layout/DashboardLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

describe('StudentPermissions page', () => {
  beforeEach(() => {
    localStorage.clear()
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

  it('renders current role from localStorage', () => {
    localStorage.setItem('group_role', 'LEADER')
    render(<StudentPermissions />)

    expect(screen.getByText('Current GroupRole: LEADER')).toBeInTheDocument()
  })
})
