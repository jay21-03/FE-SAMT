import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../../router/ProtectedRoute'

const { useProfileMock } = vi.hoisted(() => ({
  useProfileMock: vi.fn(),
}))

vi.mock('../../hooks/useAuth', () => ({
  useProfile: () => useProfileMock(),
}))

function renderProtected(role) {
  useProfileMock.mockReturnValue({
    data: role ? { role } : null,
    isLoading: false,
  })

  return render(
    <MemoryRouter initialEntries={['/secure']}>
      <Routes>
        <Route
          path="/secure"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <div>Protected content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderProtectedWithAllowedRoles(role, allowedRoles) {
  useProfileMock.mockReturnValue({
    data: role ? { role } : null,
    isLoading: false,
  })

  return render(
    <MemoryRouter initialEntries={['/secure']}>
      <Routes>
        <Route
          path="/secure"
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>Protected content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useProfileMock.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders children for allowed role', () => {
    renderProtected('ADMIN')
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('redirects to login when role is missing', () => {
    renderProtected(null)
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('redirects to login when role is not allowed', () => {
    renderProtected('STUDENT')
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('allows lecturer when lecturer role is configured', () => {
    renderProtectedWithAllowedRoles('LECTURER', ['LECTURER', 'ADMIN'])
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('redirects when role case does not match expected value', () => {
    renderProtectedWithAllowedRoles('admin', ['ADMIN'])
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('redirects when allowed roles list is empty', () => {
    renderProtectedWithAllowedRoles('ADMIN', [])
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('handles stale role left in storage for different route policy', () => {
    renderProtectedWithAllowedRoles('STUDENT', ['ADMIN', 'LECTURER'])
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })
})
