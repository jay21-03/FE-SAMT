import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import GroupList from '../../pages/shared/GroupList'

const {
  invalidateQueriesMock,
  useGroupsMock,
  useSemestersMock,
  useUsersMock,
  createGroupMock,
  refetchMock,
} = vi.hoisted(() => ({
  invalidateQueriesMock: vi.fn(),
  useGroupsMock: vi.fn(),
  useSemestersMock: vi.fn(),
  useUsersMock: vi.fn(),
  createGroupMock: vi.fn(),
  refetchMock: vi.fn(),
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
  useGroups: (query) => useGroupsMock(query),
  useSemesters: () => useSemestersMock(),
  useUsers: (query) => useUsersMock(query),
}))

vi.mock('../../api/userGroupApi', () => ({
  userGroupApi: {
    createGroup: (payload) => createGroupMock(payload),
  },
}))

vi.mock('../../components/DebouncedSearchInput', () => ({
  default: ({ placeholder, onChange }) => (
    <input
      aria-label="Search group name"
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

describe('GroupList page', () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <GroupList />
      </MemoryRouter>,
    )

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('role', 'ADMIN')

    invalidateQueriesMock.mockReset()
    useGroupsMock.mockReset()
    useSemestersMock.mockReset()
    useUsersMock.mockReset()
    createGroupMock.mockReset()
    refetchMock.mockReset()

    useGroupsMock.mockReturnValue({
      data: {
        content: [
          {
            id: 1,
            groupName: 'SE1705-G1',
            semesterCode: 'SU26',
            lecturerName: 'Dr QA',
            memberCount: 6,
          },
        ],
      },
      isLoading: false,
      refetch: refetchMock,
    })

    useSemestersMock.mockReturnValue({
      data: [{ id: 11, semesterCode: 'SU26', semesterName: 'Summer 2026' }],
    })

    useUsersMock.mockReturnValue({
      data: {
        content: [{ id: 5, fullName: 'Dr QA', email: 'qa@edu.vn' }],
      },
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders group table and create button for ADMIN', () => {
    renderPage()

    expect(screen.getByText('SE1705-G1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Group' })).toBeInTheDocument()
  })

  it('hides create button for non-admin role', () => {
    localStorage.setItem('role', 'LECTURER')
    renderPage()

    expect(screen.queryByRole('button', { name: 'Create Group' })).not.toBeInTheDocument()
  })

  it('renders empty state when no groups are returned', () => {
    useGroupsMock.mockReturnValue({
      data: { content: [] },
      isLoading: false,
      refetch: refetchMock,
    })

    renderPage()

    expect(screen.getByText('No groups found.')).toBeInTheDocument()
  })

  it('validates create form required fields', async () => {
    const { container } = renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Create Group' }))
    const modalForm = container.querySelector('.modal-form')
    fireEvent.submit(modalForm)

    expect(createGroupMock).not.toHaveBeenCalled()
    expect(await screen.findByText('Please enter group name.')).toBeInTheDocument()
  })

  it('creates a group successfully and refreshes groups query', async () => {
    createGroupMock.mockResolvedValue({ id: 99 })
    const { container } = renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Create Group' }))

    fireEvent.change(screen.getByPlaceholderText('SE1705-G1'), {
      target: { value: ' SE1706-G2 ' },
    })

    const modalForm = container.querySelector('.modal-form')
    const modalSelects = modalForm.querySelectorAll('select')
    fireEvent.change(modalSelects[0], { target: { value: '11' } })
    fireEvent.change(modalSelects[1], { target: { value: '5' } })

    const submitButton = container.querySelector('.modal-form button[type="submit"]')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(createGroupMock).toHaveBeenCalledWith({
        groupName: 'SE1706-G2',
        semesterId: 11,
        lecturerId: 5,
      })
    })

    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ['groups'] })
    expect(refetchMock).toHaveBeenCalled()
    expect(await screen.findByText('Group created successfully!')).toBeInTheDocument()
  })

  it('shows conflict message when API returns 409', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    createGroupMock.mockRejectedValue({ response: { status: 409 } })
    try {
      const { container } = renderPage()

      fireEvent.click(screen.getByRole('button', { name: 'Create Group' }))
      fireEvent.change(screen.getByPlaceholderText('SE1705-G1'), {
        target: { value: 'SE1705-G1' },
      })

      const modalForm = container.querySelector('.modal-form')
      const modalSelects = modalForm.querySelectorAll('select')
      fireEvent.change(modalSelects[0], { target: { value: '11' } })
      fireEvent.change(modalSelects[1], { target: { value: '5' } })

      const submitButton = container.querySelector('.modal-form button[type="submit"]')
      fireEvent.click(submitButton)

      expect(await screen.findByText('Group name already exists in this semester.')).toBeInTheDocument()
      expect(consoleErrorSpy).toHaveBeenCalled()
    }
    finally {
      consoleErrorSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    }
  })
})
