import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Header from '../../components/Header'

const { navigateMock, tokenClearMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  tokenClearMock: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('../../api/tokenStore.ts', () => ({
  tokenStore: {
    clear: () => tokenClearMock(),
  },
}))

describe('Header', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    tokenClearMock.mockReset()
    localStorage.clear()
    localStorage.setItem('role', 'ADMIN')
  })

  afterEach(() => {
    cleanup()
  })

  it('renders current role from localStorage', () => {
    render(<Header />)
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })

  it('navigates to profile when profile button is clicked', () => {
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: 'Profile' }))

    expect(navigateMock).toHaveBeenCalledWith('/app/profile')
  })

  it('clears auth state and navigates to login on logout', () => {
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))

    expect(tokenClearMock).toHaveBeenCalled()
    expect(localStorage.getItem('role')).toBeNull()
    expect(navigateMock).toHaveBeenCalledWith('/login')
  })
})
