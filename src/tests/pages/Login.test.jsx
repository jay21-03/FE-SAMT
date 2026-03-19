import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from '../../pages/auth/Login'

const { navigateMock, loginMock, getProfileMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  loginMock: vi.fn(),
  getProfileMock: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('../../api/authApi', () => ({
  authApi: {
    login: (payload) => loginMock(payload),
    getProfile: () => getProfileMock(),
  },
}))

function renderPage(ui) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('Login page', () => {
  beforeEach(() => {
    localStorage.clear()
    navigateMock.mockReset()
    loginMock.mockReset()
    getProfileMock.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('logs in and redirects admin to dashboard', async () => {
    loginMock.mockResolvedValue({})
    getProfileMock.mockResolvedValue({ role: 'ADMIN' })

    renderPage(<Login />)

    fireEvent.change(screen.getByPlaceholderText('you@samt.edu.vn'), {
      target: { value: 'admin@samt.edu.vn' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'Password1!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'admin@samt.edu.vn',
        password: 'Password1!',
      })
    })

    expect(localStorage.getItem('role')).toBe('ADMIN')
    expect(navigateMock).toHaveBeenCalledWith('/app/admin/dashboard')
  })

  it('logs in and redirects student to my-work', async () => {
    loginMock.mockResolvedValue({})
    getProfileMock.mockResolvedValue({ role: 'STUDENT' })

    renderPage(<Login />)

    fireEvent.change(screen.getByPlaceholderText('you@samt.edu.vn'), {
      target: { value: 'student@samt.edu.vn' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'Password1!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'student@samt.edu.vn',
        password: 'Password1!',
      })
    })

    expect(localStorage.getItem('role')).toBe('STUDENT')
    expect(navigateMock).toHaveBeenCalledWith('/app/student/my-work')
  })

  it('submits autofilled credentials on first attempt without onChange events', async () => {
    loginMock.mockResolvedValue({})
    getProfileMock.mockResolvedValue({ role: 'STUDENT' })

    renderPage(<Login />)

    const emailInput = screen.getByTestId('login-email')
    const passwordInput = screen.getByTestId('login-password')
    const form = emailInput.closest('form')
    expect(form).not.toBeNull()

    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set

    if (!valueSetter || !form) throw new Error('unable to set input values')

    valueSetter.call(emailInput, 'student@samt.edu.vn')
    valueSetter.call(passwordInput, 'Password1!')

    fireEvent.submit(form)

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'student@samt.edu.vn',
        password: 'Password1!',
      })
    })
  })

  it('shows error message when login fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    loginMock.mockRejectedValue(new Error('bad credentials'))

    try {
      renderPage(<Login />)

      fireEvent.change(screen.getByPlaceholderText('you@samt.edu.vn'), {
        target: { value: 'student@samt.edu.vn' },
      })
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'wrong' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

      expect(await screen.findByText('Đăng nhập thất bại. Vui lòng kiểm tra email hoặc mật khẩu.')).toBeInTheDocument()
      expect(consoleErrorSpy).toHaveBeenCalled()
    }
    finally {
      consoleErrorSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    }
  })

  it('navigates to register page from footer link', () => {
    renderPage(<Login />)

    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký ngay' }))
    expect(navigateMock).toHaveBeenCalledWith('/register')
  })
})
