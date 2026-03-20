import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import UserManagement from '../../pages/admin/UserManagement'

const {
  invalidateQueriesMock,
  useUsersMock,
  useAllUsersMock,
  useAuditRangeMock,
  createUserMock,
  restoreUserMock,
  refetchUsersMock,
  refetchAuditMock,
} = vi.hoisted(() => ({
  invalidateQueriesMock: vi.fn(),
  useUsersMock: vi.fn(),
  useAllUsersMock: vi.fn(),
  useAuditRangeMock: vi.fn(),
  createUserMock: vi.fn(),
  restoreUserMock: vi.fn(),
  refetchUsersMock: vi.fn(),
  refetchAuditMock: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: invalidateQueriesMock,
  }),
}))

vi.mock('../../layout/DashboardLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../hooks/useUserGroups', () => ({
  useUsers: (query) => useUsersMock(query),
  useAllUsers: (query, options) => useAllUsersMock(query, options),
}))

vi.mock('../../hooks/useIdentityAdmin', () => ({
  useAuditRange: (query, enabled) => useAuditRangeMock(query, enabled),
}))

vi.mock('../../api/identityAdminApi', () => ({
  identityAdminApi: {
    createUser: (payload) => createUserMock(payload),
    restoreUser: (userId) => restoreUserMock(userId),
  },
}))

vi.mock('../../components/DebouncedSearchInput', () => ({
  default: ({ placeholder, onChange }) => (
    <input placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  ),
}))

describe('UserManagement page', () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>,
    )

  beforeEach(() => {
    invalidateQueriesMock.mockReset()
    useUsersMock.mockReset()
    useAuditRangeMock.mockReset()
    useAllUsersMock.mockReset()
    createUserMock.mockReset()
    restoreUserMock.mockReset()
    refetchUsersMock.mockReset()
    refetchAuditMock.mockReset()

    useUsersMock.mockReturnValue({
      data: {
        content: [{ id: 1, fullName: 'QA Admin', email: 'qa@edu.vn', roles: ['ADMIN'], status: 'ACTIVE' }],
        totalElements: 1,
      },
      isLoading: false,
      refetch: refetchUsersMock,
    })

    useAllUsersMock.mockReturnValue({
      data: {
        content: [{ id: 1, fullName: 'QA Admin', email: 'qa@edu.vn', roles: ['ADMIN'], status: 'ACTIVE' }],
        totalElements: 1,
      },
      isFetching: false,
    })

    useAuditRangeMock.mockReturnValue({
      data: {
        content: [
          {
            action: 'SOFT_DELETE',
            entityType: 'User',
            entityId: 77,
            timestamp: '2026-03-10T10:00:00.000Z',
            actorEmail: 'admin@edu.vn',
          },
        ],
      },
      refetch: refetchAuditMock,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders active users tab with user table', () => {
    renderPage()

    expect(screen.getByText('User Management')).toBeInTheDocument()
    expect(screen.getByText('QA Admin')).toBeInTheDocument()
    expect(screen.getByText('qa@edu.vn')).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })

  it('restores deleted user from deleted tab', async () => {
    restoreUserMock.mockResolvedValue({ success: true })
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /Deleted Users/i }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Restore' })[1])

    await waitFor(() => {
      expect(restoreUserMock).toHaveBeenCalledWith(77)
    })

    expect(await screen.findByText('User #77 restored successfully!')).toBeInTheDocument()
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ['users'] })
    expect(refetchUsersMock).toHaveBeenCalled()
    expect(refetchAuditMock).toHaveBeenCalled()
  })

  it('creates user successfully from modal', async () => {
    createUserMock.mockResolvedValue({ user: { email: 'new@samt.edu.vn' } })
    const { container } = renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Create User' }))

    fireEvent.change(screen.getByPlaceholderText('Nguyen Van A'), {
      target: { value: 'New User' },
    })
    fireEvent.change(screen.getByPlaceholderText('user@samt.edu.vn'), {
      target: { value: 'new@samt.edu.vn' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'Password1!' },
    })

    const submitButton = container.querySelector('.modal-form button[type="submit"]')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(createUserMock).toHaveBeenCalledWith({
        fullName: 'New User',
        email: 'new@samt.edu.vn',
        password: 'Password1!',
        role: 'STUDENT',
      })
    })

    expect(await screen.findByText('User created successfully: new@samt.edu.vn')).toBeInTheDocument()
    expect(refetchUsersMock).toHaveBeenCalled()
  })
})
