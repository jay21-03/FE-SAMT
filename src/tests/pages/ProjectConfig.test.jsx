import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ProjectConfig from '../../pages/shared/ProjectConfig'

const {
  navigateMock,
  routeParams,
  useProjectConfigByGroupMock,
  useCreateProjectConfigMock,
  useUpdateProjectConfigMock,
  useVerifyProjectConfigMock,
  useProfileMock,
  useGroupMock,
  useUserGroupsMock,
  useSyncJiraMock,
  useSyncGithubMock,
  useSyncAllMock,
  useSyncJobsMock,
  createMutateAsyncMock,
  updateMutateAsyncMock,
  verifyMutateAsyncMock,
  refetchSyncJobsMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  routeParams: { groupId: '7' },
  useProjectConfigByGroupMock: vi.fn(),
  useCreateProjectConfigMock: vi.fn(),
  useUpdateProjectConfigMock: vi.fn(),
  useVerifyProjectConfigMock: vi.fn(),
  useProfileMock: vi.fn(),
  useGroupMock: vi.fn(),
  useUserGroupsMock: vi.fn(),
  useSyncJiraMock: vi.fn(),
  useSyncGithubMock: vi.fn(),
  useSyncAllMock: vi.fn(),
  useSyncJobsMock: vi.fn(),
  createMutateAsyncMock: vi.fn(),
  updateMutateAsyncMock: vi.fn(),
  verifyMutateAsyncMock: vi.fn(),
  refetchSyncJobsMock: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useParams: () => routeParams,
  useNavigate: () => navigateMock,
}))

vi.mock('../../layout/DashboardLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../hooks/useProjectConfigs', () => ({
  useProjectConfigByGroup: (groupId, options) => useProjectConfigByGroupMock(groupId, options),
  useCreateProjectConfig: () => useCreateProjectConfigMock(),
  useUpdateProjectConfig: () => useUpdateProjectConfigMock(),
  useVerifyProjectConfig: () => useVerifyProjectConfigMock(),
}))

vi.mock('../../hooks/useAuth', () => ({
  useProfile: () => useProfileMock(),
}))

vi.mock('../../hooks/useUserGroups', () => ({
  useGroup: (groupId) => useGroupMock(groupId),
  useUserGroups: (userId) => useUserGroupsMock(userId),
}))

vi.mock('../../hooks/useSync', () => ({
  useSyncJira: () => useSyncJiraMock(),
  useSyncGithub: () => useSyncGithubMock(),
  useSyncAll: () => useSyncAllMock(),
  useSyncJobs: (query) => useSyncJobsMock(query),
}))

describe('ProjectConfig page', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    localStorage.clear()

    navigateMock.mockReset()
    useProfileMock.mockReset()
    createMutateAsyncMock.mockReset()
    updateMutateAsyncMock.mockReset()
    verifyMutateAsyncMock.mockReset()
    refetchSyncJobsMock.mockReset()

    routeParams.groupId = '7'

    useProfileMock.mockReturnValue({
      data: { role: 'LECTURER' },
      isLoading: false,
    })

    useProjectConfigByGroupMock.mockReturnValue({
      data: {
        id: 'cfg-7',
        state: 'DRAFT',
        jiraHostUrl: 'https://jira.acme.com',
        jiraEmail: 'qa@acme.com',
        jiraApiToken: 'jira-token',
        githubRepoUrl: 'https://github.com/acme/repo',
        githubToken: 'ghp-token',
      },
      isLoading: false,
    })

    useUserGroupsMock.mockReturnValue({
      data: { groups: [{ groupId: 7, groupName: 'SE1704' }] },
      isLoading: false,
    })

    useCreateProjectConfigMock.mockReturnValue({
      mutateAsync: createMutateAsyncMock,
      isPending: false,
    })

    useUpdateProjectConfigMock.mockReturnValue({
      mutateAsync: updateMutateAsyncMock,
      isPending: false,
    })

    useVerifyProjectConfigMock.mockReturnValue({
      mutateAsync: verifyMutateAsyncMock,
      isPending: false,
    })

    useGroupMock.mockReturnValue({
      data: {
        groupName: 'SE1704',
        semesterCode: 'SU25',
        lecturer: { fullName: 'Dr QA' },
      },
    })

    const syncMutation = { mutateAsync: vi.fn(), isPending: false }
    useSyncJiraMock.mockReturnValue(syncMutation)
    useSyncGithubMock.mockReturnValue(syncMutation)
    useSyncAllMock.mockReturnValue(syncMutation)
    useSyncJobsMock.mockReturnValue({ data: { content: [] }, refetch: refetchSyncJobsMock })
  })

  it('renders existing configuration values', () => {
    render(<ProjectConfig />)

    expect(screen.getByDisplayValue('https://jira.acme.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('qa@acme.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://github.com/acme/repo')).toBeInTheDocument()
    expect(screen.getByText('DRAFT')).toBeInTheDocument()
  })

  it('saves edited config through update mutation', async () => {
    updateMutateAsyncMock.mockResolvedValue({})
    render(<ProjectConfig />)

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: '  new-email@acme.com  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save Config' }))

    await waitFor(() =>
      expect(updateMutateAsyncMock).toHaveBeenCalledWith({
        id: 'cfg-7',
        payload: { jiraEmail: 'new-email@acme.com' },
      }),
    )
  })

  it('shows validation error and skips create mutation when no values are provided', async () => {
    useProjectConfigByGroupMock.mockReturnValue({ data: null, isLoading: false })
    render(<ProjectConfig />)

    fireEvent.click(screen.getByRole('button', { name: 'Save Config' }))

    expect(createMutateAsyncMock).not.toHaveBeenCalled()
    expect(await screen.findByText('Please enter at least one field before saving.')).toBeInTheDocument()
  })

  it('shows API failure message when save mutation fails', async () => {
    updateMutateAsyncMock.mockRejectedValue({
      response: { data: { message: 'Save failed from API' } },
    })

    render(<ProjectConfig />)

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'error@acme.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save Config' }))

    expect(await screen.findByText('Save failed from API')).toBeInTheDocument()
  })
})
