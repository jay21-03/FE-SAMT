import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AuditLogs from '../../pages/admin/AuditLogs'

const {
  useUsersMock,
  useSecurityEventsMock,
  useAuditRangeMock,
  useAuditByActorMock,
} = vi.hoisted(() => ({
  useUsersMock: vi.fn(),
  useSecurityEventsMock: vi.fn(),
  useAuditRangeMock: vi.fn(),
  useAuditByActorMock: vi.fn(),
}))

vi.mock('../../layout/DashboardLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../hooks/useUserGroups', () => ({
  useUsers: (query) => useUsersMock(query),
}))

vi.mock('../../hooks/useIdentityAdmin', () => ({
  useSecurityEvents: (query) => useSecurityEventsMock(query),
  useAuditRange: (query, enabled) => useAuditRangeMock(query, enabled),
  useAuditByActor: (actorId, query) => useAuditByActorMock(actorId, query),
}))

describe('AuditLogs page', () => {
  beforeEach(() => {
    useUsersMock.mockReset()
    useSecurityEventsMock.mockReset()
    useAuditRangeMock.mockReset()
    useAuditByActorMock.mockReset()

    useUsersMock.mockReturnValue({
      data: {
        content: [{ id: 1, fullName: 'QA Admin', email: 'qa@edu.vn' }],
      },
    })

    useSecurityEventsMock.mockReturnValue({
      data: {
        content: [
          {
            id: 1,
            timestamp: '2026-03-10T10:00:00.000Z',
            actorEmail: 'qa@edu.vn',
            actorId: 1,
            action: 'LOGIN_SUCCESS',
            entityType: 'User',
            entityId: 1,
            outcome: 'SUCCESS',
            ipAddress: '127.0.0.1',
          },
        ],
        totalPages: 1,
        totalElements: 1,
      },
      isLoading: false,
    })

    useAuditRangeMock.mockReturnValue({ data: { content: [], totalPages: 1, totalElements: 0 }, isLoading: false })
    useAuditByActorMock.mockReturnValue({ data: { content: [], totalPages: 1, totalElements: 0 }, isLoading: false })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders security logs by default', () => {
    render(<AuditLogs />)

    expect(screen.getByText('Audit Logs')).toBeInTheDocument()
    expect(screen.getByText('LOGIN_SUCCESS')).toBeInTheDocument()
    expect(screen.getByText('SUCCESS')).toBeInTheDocument()
    expect(useSecurityEventsMock).toHaveBeenCalled()
  })

  it('switches filter type to actor and calls actor query', async () => {
    render(<AuditLogs />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'actor' } })

    await waitFor(() => {
      expect(useAuditByActorMock).toHaveBeenCalled()
    })
  })

  it('clears filters and resets to security mode', async () => {
    render(<AuditLogs />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'range' } })
    fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }))

    await waitFor(() => {
      expect(useSecurityEventsMock).toHaveBeenCalledWith({ page: 0, size: 20 })
    })
  })
})
