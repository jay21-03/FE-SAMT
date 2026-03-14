import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../../router/ProtectedRoute'

function renderProtected(role) {
  localStorage.clear()
  if (role) {
    localStorage.setItem('role', role)
  }

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
        <Route path="/" element={<div>Home page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders children for allowed role', () => {
    renderProtected('ADMIN')
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('redirects to home when role is missing', () => {
    renderProtected(null)
    expect(screen.getByText('Home page')).toBeInTheDocument()
  })

  it('redirects to home when role is not allowed', () => {
    renderProtected('STUDENT')
    expect(screen.getByText('Home page')).toBeInTheDocument()
  })
})
