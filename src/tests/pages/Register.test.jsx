import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Register from '../../pages/auth/Register'

const { navigateMock, registerMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  registerMock: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('../../api/authApi', () => ({
  authApi: {
    register: (payload) => registerMock(payload),
  },
}))

describe('Register page', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    registerMock.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows mismatch helper when passwords differ', async () => {
    render(<Register />)

    fireEvent.change(screen.getByPlaceholderText('Nguyen Van A'), { target: { value: 'QA User' } })
    fireEvent.change(screen.getByPlaceholderText('you@samt.edu.vn'), { target: { value: 'qa@edu.vn' } })
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { value: 'Password1!' } })
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[1], { target: { value: 'Password1' } })
    expect(await screen.findByText('Mật khẩu xác nhận không khớp')).toBeInTheDocument()
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('registers successfully and redirects to login', async () => {
    registerMock.mockResolvedValue({ id: 1 })
    render(<Register />)

    fireEvent.change(screen.getByPlaceholderText('Nguyen Van A'), { target: { value: 'QA User' } })
    fireEvent.change(screen.getByPlaceholderText('you@samt.edu.vn'), { target: { value: 'qa@edu.vn' } })
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { value: 'Password1!' } })
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[1], { target: { value: 'Password1!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký tài khoản' }))

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        email: 'qa@edu.vn',
        password: 'Password1!',
        confirmPassword: 'Password1!',
        fullName: 'QA User',
        role: 'STUDENT',
      })
    })

    expect(await screen.findByText('Đăng ký thành công!')).toBeInTheDocument()
  })

  it('shows conflict error when email already exists', async () => {
    registerMock.mockRejectedValue({ response: { status: 409 } })
    render(<Register />)

    fireEvent.change(screen.getByPlaceholderText('Nguyen Van A'), { target: { value: 'QA User' } })
    fireEvent.change(screen.getByPlaceholderText('you@samt.edu.vn'), { target: { value: 'qa@edu.vn' } })
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { value: 'Password1!' } })
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[1], { target: { value: 'Password1!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký tài khoản' }))

    expect(await screen.findByText('Email này đã được đăng ký. Vui lòng sử dụng email khác.')).toBeInTheDocument()
  })
})
