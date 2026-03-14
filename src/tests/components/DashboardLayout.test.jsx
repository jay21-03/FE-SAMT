import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DashboardLayout from '../../layout/DashboardLayout'

vi.mock('../../components/Sidebar.jsx', () => ({
  default: () => <div>Sidebar Stub</div>,
}))

vi.mock('../../components/Header.jsx', () => ({
  default: () => <div>Header Stub</div>,
}))

describe('DashboardLayout', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders sidebar, header, and content children', () => {
    render(
      <DashboardLayout>
        <div>Main Content</div>
      </DashboardLayout>,
    )

    expect(screen.getByText('Sidebar Stub')).toBeInTheDocument()
    expect(screen.getByText('Header Stub')).toBeInTheDocument()
    expect(screen.getByText('Main Content')).toBeInTheDocument()
  })
})
