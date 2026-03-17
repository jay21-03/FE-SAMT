import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'

const { useProfileMock } = vi.hoisted(() => ({
  useProfileMock: vi.fn(),
}))

vi.mock('../../hooks/useAuth', () => ({
  useProfile: () => useProfileMock(),
}))

function renderSidebar(role) {
  useProfileMock.mockReturnValue({
    data: role ? { role } : null,
    isLoading: false,
  })

  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    useProfileMock.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders admin navigation links for ADMIN role', () => {
    renderSidebar('ADMIN')
    expect(screen.getByText('User Management')).toBeInTheDocument()
    expect(screen.getByText('Project Configs')).toBeInTheDocument()
  })

  it('renders lecturer navigation links for LECTURER role', () => {
    renderSidebar('LECTURER')
    expect(screen.getByText('My Groups')).toBeInTheDocument()
    expect(screen.getByText('GitHub Stats')).toBeInTheDocument()
  })

  it('renders student navigation links for STUDENT role', () => {
    renderSidebar('STUDENT')
    expect(screen.getByText('Team Board')).toBeInTheDocument()
    expect(screen.getByText('My Work')).toBeInTheDocument()
    expect(screen.getByText('Permissions')).toBeInTheDocument()
  })
})
