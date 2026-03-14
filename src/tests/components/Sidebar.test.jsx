import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'

function renderSidebar(role) {
  localStorage.clear()
  if (role) {
    localStorage.setItem('role', role)
  }

  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    localStorage.clear()
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
    expect(screen.getByText('My Tasks')).toBeInTheDocument()
    expect(screen.getByText('Permissions')).toBeInTheDocument()
  })
})
