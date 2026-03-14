import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import UserProfile from '../../pages/shared/UserProfile'

const {
  navigateMock,
  useProfileMock,
  useUpdateProfileMock,
  updateMutateAsyncMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  useProfileMock: vi.fn(),
  useUpdateProfileMock: vi.fn(),
  updateMutateAsyncMock: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('../../layout/DashboardLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../hooks/useAuth', () => ({
  useProfile: () => useProfileMock(),
  useUpdateProfile: () => useUpdateProfileMock(),
}))

describe('UserProfile page', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    useProfileMock.mockReset()
    useUpdateProfileMock.mockReset()
    updateMutateAsyncMock.mockReset()

    useProfileMock.mockReturnValue({
      data: {
        id: 7,
        fullName: 'QA Student',
        email: 'qa@student.edu',
        role: 'STUDENT',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00.000Z',
        jiraAccountId: null,
        githubUsername: 'qa-student',
      },
      isLoading: false,
      error: null,
    })

    useUpdateProfileMock.mockReturnValue({
      mutateAsync: updateMutateAsyncMock,
      isPending: false,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders loading state while profile is loading', () => {
    useProfileMock.mockReturnValue({ data: null, isLoading: true, error: null })
    render(<UserProfile />)

    expect(screen.getByText('Loading profile...')).toBeInTheDocument()
  })

  it('renders error state and navigates back', () => {
    useProfileMock.mockReturnValue({ data: null, isLoading: false, error: new Error('failed') })
    render(<UserProfile />)

    fireEvent.click(screen.getByRole('button', { name: 'Go Back' }))
    expect(screen.getByText('Failed to load profile')).toBeInTheDocument()
    expect(navigateMock).toHaveBeenCalledWith(-1)
  })

  it('validates required full name and skips mutation', async () => {
    render(<UserProfile />)

    fireEvent.change(screen.getByPlaceholderText('Your full name'), {
      target: { value: '   ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(updateMutateAsyncMock).not.toHaveBeenCalled()
    expect(await screen.findByText('Full name is required.')).toBeInTheDocument()
  })

  it('saves trimmed profile fields successfully', async () => {
    updateMutateAsyncMock.mockResolvedValue({ id: 7 })
    render(<UserProfile />)

    fireEvent.change(screen.getByPlaceholderText('Your full name'), {
      target: { value: '  QA New Name  ' },
    })
    fireEvent.change(screen.getByPlaceholderText('you@samt.edu.vn'), {
      target: { value: '  qa-new@student.edu  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(updateMutateAsyncMock).toHaveBeenCalledWith({
        fullName: 'QA New Name',
        email: 'qa-new@student.edu',
      })
    })
    expect(await screen.findByText('Profile updated successfully!')).toBeInTheDocument()
  })

  it('shows conflict message when API returns 409', async () => {
    updateMutateAsyncMock.mockRejectedValue({ response: { status: 409 } })
    render(<UserProfile />)

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(await screen.findByText('This email is already in use.')).toBeInTheDocument()
  })
})
