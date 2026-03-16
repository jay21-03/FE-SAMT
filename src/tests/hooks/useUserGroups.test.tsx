import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import {
  useAddMember,
  useCreateGroup,
  useCreateSemester,
  useGroup,
  useGroupMembers,
  useGroups,
  useRemoveMember,
  useSemesters,
  useActiveSemester,
  useUpdateGroup,
  useUpdateGroupLecturer,
  useUpdateSemester,
  useUpdateUser,
  useUser,
  useUserGroups,
  useUsers,
} from '../../hooks/useUserGroups'

const {
  listGroupsMock,
  listUsersMock,
  getGroupMembersMock,
  getGroupMock,
  listSemestersMock,
  getActiveSemesterMock,
  getUserMock,
  getUserGroupsMock,
  updateUserMock,
  createSemesterMock,
  updateSemesterMock,
  createGroupMock,
  updateGroupMock,
  updateGroupLecturerMock,
  addMemberMock,
  removeMemberMock,
} = vi.hoisted(() => ({
  listGroupsMock: vi.fn(),
  listUsersMock: vi.fn(),
  getGroupMembersMock: vi.fn(),
  getGroupMock: vi.fn(),
  listSemestersMock: vi.fn(),
  getActiveSemesterMock: vi.fn(),
  getUserMock: vi.fn(),
  getUserGroupsMock: vi.fn(),
  updateUserMock: vi.fn(),
  createSemesterMock: vi.fn(),
  updateSemesterMock: vi.fn(),
  createGroupMock: vi.fn(),
  updateGroupMock: vi.fn(),
  updateGroupLecturerMock: vi.fn(),
  addMemberMock: vi.fn(),
  removeMemberMock: vi.fn(),
}))

vi.mock('../../api/userGroupApi.ts', () => ({
  userGroupApi: {
    listGroups: listGroupsMock,
    listUsers: listUsersMock,
    getGroupMembers: getGroupMembersMock,
    getGroup: getGroupMock,
    listSemesters: listSemestersMock,
    getActiveSemester: getActiveSemesterMock,
    getUser: getUserMock,
    getUserGroups: getUserGroupsMock,
    updateUser: updateUserMock,
    createSemester: createSemesterMock,
    updateSemester: updateSemesterMock,
    createGroup: createGroupMock,
    updateGroup: updateGroupMock,
    updateGroupLecturer: updateGroupLecturerMock,
    addMember: addMemberMock,
    removeMember: removeMemberMock,
  },
}))

function wrapperFactory() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useUserGroups hooks', () => {
  beforeEach(() => {
    listGroupsMock.mockReset()
    listUsersMock.mockReset()
    getGroupMembersMock.mockReset()
    getGroupMock.mockReset()
    listSemestersMock.mockReset()
    getActiveSemesterMock.mockReset()
    getUserMock.mockReset()
    getUserGroupsMock.mockReset()
    updateUserMock.mockReset()
    createSemesterMock.mockReset()
    updateSemesterMock.mockReset()
    createGroupMock.mockReset()
    updateGroupMock.mockReset()
    updateGroupLecturerMock.mockReset()
    addMemberMock.mockReset()
    removeMemberMock.mockReset()
  })

  it('fetches groups when enabled', async () => {
    listGroupsMock.mockResolvedValue({ content: [{ id: 1, groupName: 'SE1704' }] })

    const { result } = renderHook(() => useGroups({ page: 0, size: 20 }, { enabled: true }), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.content).toEqual([{ id: 1, groupName: 'SE1704' }])
    expect(listGroupsMock).toHaveBeenCalledTimes(1)
  })

  it('fetches groups when options are omitted (default enabled)', async () => {
    listGroupsMock.mockResolvedValue({ content: [{ id: 2, groupName: 'SE1705' }] })

    const { result } = renderHook(() => useGroups({ page: 1, size: 10 }), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listGroupsMock).toHaveBeenCalledWith({ page: 1, size: 10 })
  })

  it('does not fetch groups when explicitly disabled', async () => {
    const { result } = renderHook(() => useGroups({ page: 0, size: 20 }, { enabled: false }), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(listGroupsMock).not.toHaveBeenCalled()
  })

  it('fetches users, semesters and active semester', async () => {
    listUsersMock.mockResolvedValue({ content: [{ id: 2, email: 'qa@samt.local' }] })
    listSemestersMock.mockResolvedValue([{ id: 10, semesterCode: '2026S1' }])
    getActiveSemesterMock.mockResolvedValue({ id: 10, semesterCode: '2026S1', active: true })

    const usersHook = renderHook(() => useUsers({ page: 0, size: 10 } as any), { wrapper: wrapperFactory() })
    const semestersHook = renderHook(() => useSemesters(), { wrapper: wrapperFactory() })
    const activeSemesterHook = renderHook(() => useActiveSemester(), { wrapper: wrapperFactory() })

    await waitFor(() => expect(usersHook.result.current.isSuccess).toBe(true))
    await waitFor(() => expect(semestersHook.result.current.isSuccess).toBe(true))
    await waitFor(() => expect(activeSemesterHook.result.current.isSuccess).toBe(true))

    expect(listUsersMock).toHaveBeenCalledWith({ page: 0, size: 10 })
    expect(listSemestersMock).toHaveBeenCalledTimes(1)
    expect(getActiveSemesterMock).toHaveBeenCalledTimes(1)
  })

  it('does not fetch group members for invalid group id', async () => {
    const { result } = renderHook(() => useGroupMembers(0), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(getGroupMembersMock).not.toHaveBeenCalled()
  })

  it('fetches group members for valid group id', async () => {
    getGroupMembersMock.mockResolvedValue([{ userId: 15, fullName: 'Member 15' }])

    const { result } = renderHook(() => useGroupMembers(15), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ userId: 15, fullName: 'Member 15' }])
    expect(getGroupMembersMock).toHaveBeenCalledWith(15)
  })

  it('applies enabled guard for useGroup and fetches when valid', async () => {
    const disabledHook = renderHook(() => useGroup(0), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(disabledHook.result.current.fetchStatus).toBe('idle'))
    expect(getGroupMock).not.toHaveBeenCalled()

    getGroupMock.mockResolvedValue({ id: 4, groupName: 'SE1704' })

    const enabledHook = renderHook(() => useGroup(4), {
      wrapper: wrapperFactory(),
    })

    await waitFor(() => expect(enabledHook.result.current.isSuccess).toBe(true))
    expect(getGroupMock).toHaveBeenCalledWith(4)
  })

  it('does not fetch user details or memberships for invalid user id', async () => {
    const userHook = renderHook(() => useUser(0), { wrapper: wrapperFactory() })
    const groupsHook = renderHook(() => useUserGroups(0), { wrapper: wrapperFactory() })

    await waitFor(() => expect(userHook.result.current.fetchStatus).toBe('idle'))
    await waitFor(() => expect(groupsHook.result.current.fetchStatus).toBe('idle'))

    expect(getUserMock).not.toHaveBeenCalled()
    expect(getUserGroupsMock).not.toHaveBeenCalled()
  })

  it('fetches user details and memberships for valid user id', async () => {
    getUserMock.mockResolvedValue({ id: 11, email: 'user@samt.local' })
    getUserGroupsMock.mockResolvedValue({ groups: [{ id: 3, groupName: 'SE1703' }] })

    const userHook = renderHook(() => useUser(11), { wrapper: wrapperFactory() })
    const groupsHook = renderHook(() => useUserGroups(11), { wrapper: wrapperFactory() })

    await waitFor(() => expect(userHook.result.current.isSuccess).toBe(true))
    await waitFor(() => expect(groupsHook.result.current.isSuccess).toBe(true))

    expect(getUserMock).toHaveBeenCalledWith(11)
    expect(getUserGroupsMock).toHaveBeenCalledWith(11)
  })

  it('runs mutation wrappers and forwards payloads', async () => {
    updateUserMock.mockResolvedValue({ id: 11 })
    createSemesterMock.mockResolvedValue({ id: 1 })
    updateSemesterMock.mockResolvedValue({ id: 1 })
    createGroupMock.mockResolvedValue({ id: 4 })
    updateGroupMock.mockResolvedValue({ id: 4 })
    updateGroupLecturerMock.mockResolvedValue({ id: 4, lecturerId: 99 })
    addMemberMock.mockResolvedValue({ userId: 20 })
    removeMemberMock.mockResolvedValue({ ok: true })

    const updateUserHook = renderHook(() => useUpdateUser(), { wrapper: wrapperFactory() })
    const createSemesterHook = renderHook(() => useCreateSemester(), { wrapper: wrapperFactory() })
    const updateSemesterHook = renderHook(() => useUpdateSemester(), { wrapper: wrapperFactory() })
    const createGroupHook = renderHook(() => useCreateGroup(), { wrapper: wrapperFactory() })
    const updateGroupHook = renderHook(() => useUpdateGroup(), { wrapper: wrapperFactory() })
    const updateLecturerHook = renderHook(() => useUpdateGroupLecturer(), { wrapper: wrapperFactory() })
    const addMemberHook = renderHook(() => useAddMember(), { wrapper: wrapperFactory() })
    const removeMemberHook = renderHook(() => useRemoveMember(), { wrapper: wrapperFactory() })

    await updateUserHook.result.current.mutateAsync({ userId: 11, payload: { fullName: 'Updated' } as any })
    await createSemesterHook.result.current.mutateAsync({ semesterCode: '2026S2' } as any)
    await updateSemesterHook.result.current.mutateAsync({ id: 1, payload: { semesterName: 'S2' } as any })
    await createGroupHook.result.current.mutateAsync({ groupName: 'SE1704' } as any)
    await updateGroupHook.result.current.mutateAsync({ groupId: 4, payload: { groupName: 'SE1704A' } as any })
    await updateLecturerHook.result.current.mutateAsync({ groupId: 4, payload: { lecturerId: 99 } as any })
    await addMemberHook.result.current.mutateAsync({ groupId: 4, payload: { userId: 20 } as any })
    await removeMemberHook.result.current.mutateAsync({ groupId: 4, userId: 20 })

    expect(updateUserMock).toHaveBeenCalledWith(11, { fullName: 'Updated' })
    expect(createSemesterMock).toHaveBeenCalledWith({ semesterCode: '2026S2' })
    expect(updateSemesterMock).toHaveBeenCalledWith(1, { semesterName: 'S2' })
    expect(createGroupMock).toHaveBeenCalledWith({ groupName: 'SE1704' })
    expect(updateGroupMock).toHaveBeenCalledWith(4, { groupName: 'SE1704A' })
    expect(updateGroupLecturerMock).toHaveBeenCalledWith(4, { lecturerId: 99 })
    expect(addMemberMock).toHaveBeenCalledWith(4, { userId: 20 })
    expect(removeMemberMock).toHaveBeenCalledWith(4, 20)
  })
})
