import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiClientMocks = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  putMock: vi.fn(),
  patchMock: vi.fn(),
  deleteMock: vi.fn(),
}))

vi.mock('../../../api/apiClient.ts', () => ({
  api: {
    get: apiClientMocks.getMock,
    post: apiClientMocks.postMock,
    put: apiClientMocks.putMock,
    patch: apiClientMocks.patchMock,
    delete: apiClientMocks.deleteMock,
  },
}))

import { userGroupApi } from '../../../api/userGroupApi'

describe('userGroupApi', () => {
  beforeEach(() => {
    apiClientMocks.getMock.mockReset()
    apiClientMocks.postMock.mockReset()
    apiClientMocks.putMock.mockReset()
    apiClientMocks.patchMock.mockReset()
    apiClientMocks.deleteMock.mockReset()
  })

  it('strips empty query params when listing users', async () => {
    apiClientMocks.getMock.mockResolvedValue({ data: { data: { content: [] } } })

    await userGroupApi.listUsers({ page: 0, size: 20, role: 'ADMIN', search: '' } as any)

    expect(apiClientMocks.getMock).toHaveBeenCalledWith('/api/users', {
      params: { page: 0, size: 20, role: 'ADMIN' },
    })
  })

  it('normalizes group members from paged content shape', async () => {
    apiClientMocks.getMock.mockResolvedValue({
      data: {
        data: {
          content: [{ userId: 1, fullName: 'Member One' }],
        },
      },
    })

    const members = await userGroupApi.getGroupMembers(10)
    expect(members).toEqual([{ userId: 1, fullName: 'Member One' }])
  })

  it('returns direct member array payload as-is', async () => {
    apiClientMocks.getMock.mockResolvedValue({
      data: [{ userId: 2, fullName: 'Member Two' }],
    })

    const members = await userGroupApi.getGroupMembers(11)
    expect(members).toEqual([{ userId: 2, fullName: 'Member Two' }])
  })

  it('strips empty query params when listing groups', async () => {
    apiClientMocks.getMock.mockResolvedValue({ data: { content: [] } })

    await userGroupApi.listGroups({ page: 1, size: 10, semesterId: 8, search: '' } as any)

    expect(apiClientMocks.getMock).toHaveBeenCalledWith('/api/groups', {
      params: { page: 1, size: 10, semesterId: 8 },
    })
  })

  it('calls semester and member mutation endpoints with expected payloads', async () => {
    apiClientMocks.patchMock.mockResolvedValue({ data: { ok: true } })
    apiClientMocks.postMock.mockResolvedValue({ data: { data: { userId: 12, fullName: 'Member Twelve' } } })
    apiClientMocks.putMock.mockResolvedValue({ data: { data: { userId: 12, role: 'LEADER' } } })
    apiClientMocks.deleteMock.mockResolvedValue({ data: { ok: true } })

    const activation = await userGroupApi.activateSemester(5)
    const added = await userGroupApi.addMember(7, { userId: 12 } as any)
    const promoted = await userGroupApi.promoteToLeader(7, 12)
    await userGroupApi.removeMember(7, 12)

    expect(apiClientMocks.patchMock).toHaveBeenCalledWith('/api/semesters/5/activate')
    expect(apiClientMocks.postMock).toHaveBeenCalledWith('/api/groups/7/members', { userId: 12 })
    expect(apiClientMocks.putMock).toHaveBeenCalledWith('/api/groups/7/members/12/promote')
    expect(apiClientMocks.deleteMock).toHaveBeenCalledWith('/api/groups/7/members/12')
    expect(activation).toEqual({ ok: true })
    expect(added).toEqual({ userId: 12, fullName: 'Member Twelve' })
    expect(promoted).toEqual({ userId: 12, role: 'LEADER' })
  })

  it('covers user, semester and group CRUD endpoints', async () => {
    apiClientMocks.getMock.mockResolvedValueOnce({ data: { data: { id: 2, email: 'user@samt.local' } } })
    apiClientMocks.putMock.mockResolvedValueOnce({ data: { data: { id: 2, fullName: 'Updated User' } } })
    apiClientMocks.getMock.mockResolvedValueOnce({ data: { data: { groups: [] } } })
    apiClientMocks.getMock.mockResolvedValueOnce({ data: { data: [{ id: 1, semesterCode: '2026S1' }] } })
    apiClientMocks.getMock.mockResolvedValueOnce({ data: { data: { id: 1, semesterCode: '2026S1' } } })
    apiClientMocks.getMock.mockResolvedValueOnce({ data: { data: { id: 1, semesterCode: '2026S1', isActive: true } } })
    apiClientMocks.getMock.mockResolvedValueOnce({ data: { data: { id: 1, semesterCode: '2026S1' } } })
    apiClientMocks.postMock.mockResolvedValueOnce({ data: { data: { id: 3, semesterCode: '2026S2' } } })
    apiClientMocks.putMock.mockResolvedValueOnce({ data: { data: { id: 3, semesterCode: '2026S2-updated' } } })
    apiClientMocks.getMock.mockResolvedValueOnce({ data: { data: { content: [{ id: 8, groupName: 'SE1708' }] } } })
    apiClientMocks.getMock.mockResolvedValueOnce({ data: { data: { id: 8, groupName: 'SE1708' } } })
    apiClientMocks.postMock.mockResolvedValueOnce({ data: { data: { id: 9, groupName: 'SE1709' } } })
    apiClientMocks.putMock.mockResolvedValueOnce({ data: { data: { id: 9, groupName: 'SE1709-Updated' } } })
    apiClientMocks.deleteMock.mockResolvedValueOnce({ data: { ok: true } })
    apiClientMocks.patchMock.mockResolvedValueOnce({ data: { data: { id: 9, lecturerId: 44 } } })

    await expect(userGroupApi.getUser(2)).resolves.toEqual({ id: 2, email: 'user@samt.local' })
    await expect(userGroupApi.updateUser(2, { fullName: 'Updated User' } as any)).resolves.toEqual({ id: 2, fullName: 'Updated User' })
    await expect(userGroupApi.getUserGroups(2)).resolves.toEqual({ groups: [] })
    await expect(userGroupApi.listSemesters()).resolves.toEqual([{ id: 1, semesterCode: '2026S1' }])
    await expect(userGroupApi.getSemester(1)).resolves.toEqual({ id: 1, semesterCode: '2026S1' })
    await expect(userGroupApi.getActiveSemester()).resolves.toEqual({ id: 1, semesterCode: '2026S1', isActive: true })
    await expect(userGroupApi.getSemesterByCode('2026S1')).resolves.toEqual({ id: 1, semesterCode: '2026S1' })
    await expect(userGroupApi.createSemester({ semesterCode: '2026S2' } as any)).resolves.toEqual({ id: 3, semesterCode: '2026S2' })
    await expect(userGroupApi.updateSemester(3, { semesterName: 'Sem 2' } as any)).resolves.toEqual({ id: 3, semesterCode: '2026S2-updated' })
    await expect(userGroupApi.listGroups({ page: 0, size: 10 } as any)).resolves.toEqual({ content: [{ id: 8, groupName: 'SE1708' }] })
    await expect(userGroupApi.getGroup(8)).resolves.toEqual({ id: 8, groupName: 'SE1708' })
    await expect(userGroupApi.createGroup({ groupName: 'SE1709' } as any)).resolves.toEqual({ id: 9, groupName: 'SE1709' })
    await expect(userGroupApi.updateGroup(9, { groupName: 'SE1709-Updated' } as any)).resolves.toEqual({ id: 9, groupName: 'SE1709-Updated' })
    await expect(userGroupApi.deleteGroup(9)).resolves.toEqual({ ok: true })
    await expect(userGroupApi.updateGroupLecturer(9, { lecturerId: 44 } as any)).resolves.toEqual({ id: 9, lecturerId: 44 })

    expect(apiClientMocks.getMock).toHaveBeenCalledWith('/api/users/2')
    expect(apiClientMocks.putMock).toHaveBeenCalledWith('/api/users/2', { fullName: 'Updated User' })
    expect(apiClientMocks.getMock).toHaveBeenCalledWith('/api/users/2/groups')
    expect(apiClientMocks.getMock).toHaveBeenCalledWith('/api/semesters')
    expect(apiClientMocks.getMock).toHaveBeenCalledWith('/api/semesters/1')
    expect(apiClientMocks.getMock).toHaveBeenCalledWith('/api/semesters/active')
    expect(apiClientMocks.getMock).toHaveBeenCalledWith('/api/semesters/code/2026S1')
    expect(apiClientMocks.postMock).toHaveBeenCalledWith('/api/semesters', { semesterCode: '2026S2' })
    expect(apiClientMocks.putMock).toHaveBeenCalledWith('/api/semesters/3', { semesterName: 'Sem 2' })
    expect(apiClientMocks.getMock).toHaveBeenCalledWith('/api/groups', { params: { page: 0, size: 10 } })
    expect(apiClientMocks.getMock).toHaveBeenCalledWith('/api/groups/8')
    expect(apiClientMocks.postMock).toHaveBeenCalledWith('/api/groups', { groupName: 'SE1709' })
    expect(apiClientMocks.putMock).toHaveBeenCalledWith('/api/groups/9', { groupName: 'SE1709-Updated' })
    expect(apiClientMocks.deleteMock).toHaveBeenCalledWith('/api/groups/9')
    expect(apiClientMocks.patchMock).toHaveBeenCalledWith('/api/groups/9/lecturer', { lecturerId: 44 })
  })

  it('covers demotion endpoint', async () => {
    apiClientMocks.putMock.mockResolvedValue({ data: { data: { userId: 99, role: 'MEMBER' } } })

    const demoted = await userGroupApi.demoteToMember(7, 99)

    expect(apiClientMocks.putMock).toHaveBeenCalledWith('/api/groups/7/members/99/demote')
    expect(demoted).toEqual({ userId: 99, role: 'MEMBER' })
  })
})
